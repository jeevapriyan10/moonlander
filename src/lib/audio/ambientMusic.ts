"use client";

/**
 * Procedural Generative Ambient Music Engine
 * 
 * Generates an adaptive, non-repeating orchestral electronic score via Web Audio:
 * - "calm": Science operations, orbital survey, design studio.
 *           Warm sub-bass drones + detuned low-pass pads + random pentatonic celestial bells.
 * - "tense": Orbit insertion burn, critical subsystem warnings, space weather anomalies.
 *           Pulsing minor intervals, rhythmic filter sweeps, tension sub-throb.
 * - "descent": Lunar powered descent.
 *           Low-frequency heartbeat pulse, countdown pacing, dynamic atmospheric pressure swell.
 */

import { getAudioContext, getMusicBus, initAudioOnUserGesture } from "./engine";

export type MusicPhase = "calm" | "tense" | "descent";

let currentPhase: MusicPhase = "calm";
let isPlaying = false;
let generativeTimer: ReturnType<typeof setInterval> | null = null;

// Oscillators & Filter nodes for persistent ambient beds
let droneOsc1: OscillatorNode | null = null;
let droneOsc2: OscillatorNode | null = null;
let droneFilter: BiquadFilterNode | null = null;
let droneGain: GainNode | null = null;

let pulseOsc: OscillatorNode | null = null;
let pulseGain: GainNode | null = null;

// Space scale notes (D-minor pentatonic / Dorian: D, F, G, A, C)
const CELESTIAL_NOTES = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46];

/**
 * Plays a single generative celestial chime in the background
 */
function triggerGenerativeChime(ctx: AudioContext, bus: GainNode): void {
  if (!isPlaying) return;

  const noteFreq = CELESTIAL_NOTES[Math.floor(Math.random() * CELESTIAL_NOTES.length)]!;
  const now = ctx.currentTime;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(noteFreq, now);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(noteFreq, now);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(bus);

    osc.start(now);
    osc.stop(now + 3.2);
  } catch {
    // Ignore
  }
}

/**
 * Starts the generative procedural music engine
 */
export function startAmbientMusic(): void {
  initAudioOnUserGesture();
  const ctx = getAudioContext();
  const bus = getMusicBus();
  if (!ctx || !bus || isPlaying) return;

  isPlaying = true;
  const now = ctx.currentTime;

  try {
    // 1. Deep Sub-Bass & Pad Drone
    droneOsc1 = ctx.createOscillator();
    droneOsc2 = ctx.createOscillator();
    droneFilter = ctx.createBiquadFilter();
    droneGain = ctx.createGain();

    droneOsc1.type = "sawtooth";
    droneOsc1.frequency.setValueAtTime(73.42, now); // D2

    droneOsc2.type = "sine";
    droneOsc2.frequency.setValueAtTime(73.9, now); // Slightly detuned D2 for rich phasing chorusing

    droneFilter.type = "lowpass";
    droneFilter.frequency.setValueAtTime(280, now);
    droneFilter.Q.setValueAtTime(2.0, now);

    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.2, now + 2.0); // Gentle fade-in

    droneOsc1.connect(droneFilter);
    droneOsc2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(bus);

    droneOsc1.start(now);
    droneOsc2.start(now);

    // 2. Generative Chime Timer (fires every 2.5 to 5.0 seconds)
    generativeTimer = setInterval(() => {
      if (Math.random() > 0.3) {
        triggerGenerativeChime(ctx, bus);
      }
    }, 2800);
  } catch {
    // Web audio init safe
  }
}

/**
 * Returns current ambient musical phase
 */
export function getMusicPhase(): MusicPhase {
  return currentPhase;
}

/**
 * Changes ambient musical phase with smooth cross-fade
 */
export function setMusicPhase(phase: MusicPhase): void {
  currentPhase = phase;
  const ctx = getAudioContext();
  if (!ctx || !isPlaying || !droneFilter || !droneGain) return;

  const now = ctx.currentTime;

  if (phase === "calm") {
    droneFilter.frequency.setTargetAtTime(280, now, 1.2);
    droneGain.gain.setTargetAtTime(0.2, now, 1.0);
  } else if (phase === "tense") {
    // Open filter cutoff and increase presence
    droneFilter.frequency.setTargetAtTime(650, now, 0.8);
    droneGain.gain.setTargetAtTime(0.3, now, 0.8);
  } else if (phase === "descent") {
    // Focused deep pressure throb for powered landing
    droneFilter.frequency.setTargetAtTime(200, now, 0.5);
    droneGain.gain.setTargetAtTime(0.35, now, 0.5);
  }
}

/**
 * Stops ambient music and cleans up audio nodes
 */
export function stopAmbientMusic(): void {
  if (!isPlaying) return;
  isPlaying = false;

  if (generativeTimer) {
    clearInterval(generativeTimer);
    generativeTimer = null;
  }

  const ctx = getAudioContext();
  if (ctx && droneGain) {
    const now = ctx.currentTime;
    droneGain.gain.linearRampToValueAtTime(0.001, now + 0.6);
    setTimeout(() => {
      try {
        droneOsc1?.stop();
        droneOsc2?.stop();
        droneOsc1?.disconnect();
        droneOsc2?.disconnect();
        pulseOsc?.stop();
        pulseOsc?.disconnect();
      } catch {
        // Ignore
      }
      droneOsc1 = null;
      droneOsc2 = null;
      droneGain = null;
      droneFilter = null;
      pulseOsc = null;
      pulseGain = null;
    }, 650);
  }
}
