"use client";

/**
 * Procedural Web Audio Engine for MoonLander
 * 
 * 100% Procedurally Synthesized (Zero external audio samples/files).
 * Features:
 * - Master Dynamics Compressor / Limiter (prevents digital clipping)
 * - Persisted Master / Music / SFX Gain Nodes
 * - User-gesture activation gate (respects browser autoplay policies)
 * - Auto-suspends on page hide / tab blur to conserve CPU/battery
 */

import { useSettingsStore } from "@/store/settings";

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let isInitialized = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioContext) {
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtxClass) return null;

      audioContext = new AudioCtxClass();

      // Master Compressor / Brickwall Limiter
      compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, audioContext.currentTime);
      compressor.knee.setValueAtTime(6, audioContext.currentTime);
      compressor.ratio.setValueAtTime(8, audioContext.currentTime);
      compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
      compressor.release.setValueAtTime(0.25, audioContext.currentTime);

      // Gain Nodes
      masterGain = audioContext.createGain();
      musicGain = audioContext.createGain();
      sfxGain = audioContext.createGain();

      // Routing: [Music & SFX] -> Master Gain -> Compressor -> Hardware Output
      musicGain.connect(masterGain);
      sfxGain.connect(masterGain);
      masterGain.connect(compressor);
      compressor.connect(audioContext.destination);

      updateVolumesFromSettings();
    } catch (e) {
      console.warn("[MoonLander Audio] Web Audio initialization deferred:", e);
      return null;
    }
  }

  return audioContext;
}

export function getMusicBus(): GainNode | null {
  getAudioContext();
  return musicGain;
}

export function getSfxBus(): GainNode | null {
  getAudioContext();
  return sfxGain;
}

/**
 * Synchronizes Web Audio gain levels with user settings store
 */
export function updateVolumesFromSettings(): void {
  if (!audioContext || !masterGain || !musicGain || !sfxGain) return;

  const settings = useSettingsStore.getState();
  const now = audioContext.currentTime;

  const isEnabled = settings.soundEnabled;
  const masterVal = isEnabled ? (settings.masterVolume / 100) : 0;
  const musicVal = (settings.musicVolume / 100) * 0.7; // Music mastered slightly softer
  const sfxVal = (settings.sfxVolume / 100);

  masterGain.gain.setValueAtTime(masterVal, now);
  musicGain.gain.setValueAtTime(musicVal, now);
  sfxGain.gain.setValueAtTime(sfxVal, now);
}

/**
 * Initializes audio context upon explicit user gesture (click, keypress, touch)
 */
export function initAudioOnUserGesture(): void {
  if (isInitialized) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().then(() => {
      isInitialized = true;
      updateVolumesFromSettings();
    }).catch(() => {});
  } else {
    isInitialized = true;
    updateVolumesFromSettings();
  }
}

// Auto-wire user gesture unlock once in browser
if (typeof window !== "undefined") {
  const unlockEvents = ["pointerdown", "keydown", "touchstart"];
  const handleUnlock = () => {
    initAudioOnUserGesture();
    unlockEvents.forEach((evt) => window.removeEventListener(evt, handleUnlock));
  };
  unlockEvents.forEach((evt) => window.addEventListener(evt, handleUnlock, { once: true, passive: true }));

  // Handle visibility changes to pause audio processing when tab is backgrounded
  document.addEventListener("visibilitychange", () => {
    if (audioContext) {
      if (document.visibilityState === "hidden" && audioContext.state === "running") {
        audioContext.suspend().catch(() => {});
      } else if (document.visibilityState === "visible" && isInitialized && audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
      }
    }
  });

  // Subscribe to volume changes
  useSettingsStore.subscribe(() => {
    updateVolumesFromSettings();
  });
}
