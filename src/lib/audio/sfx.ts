"use client";

/**
 * Pure Procedural Sound Effects Synthesizer for MoonLander
 * 
 * Generates tactile aerospace audio directly via Web Audio DSP:
 * - UI tactile clicks and hover blips
 * - Master Caution / Alert chimes
 * - Achievement Fanfares
 * - Radio-Squelch effect for CAPCOM transmissions
 * - Touchdown contact impulse (scaled by impact speed)
 * - Throttle-driven continuous thruster rumble
 */

import { getAudioContext, getSfxBus, initAudioOnUserGesture } from "./engine";

let thrusterOsc: AudioBufferSourceNode | null = null;
let thrusterGain: GainNode | null = null;
let thrusterFilter: BiquadFilterNode | null = null;

/**
 * Generates a white noise buffer
 */
function createNoiseBuffer(ctx: AudioContext, durationSeconds = 1.0): AudioBuffer {
  const bufferSize = ctx.sampleRate * durationSeconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Tactical UI Click (Subtle high-tech physical switch relay)
 */
export function playClick(): void {
  initAudioOnUserGesture();
  const ctx = getAudioContext();
  const bus = getSfxBus();
  if (!ctx || !bus) return;

  const now = ctx.currentTime;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.015);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    osc.connect(gain);
    gain.connect(bus);

    osc.start(now);
    osc.stop(now + 0.015);
  } catch {
    // Ignore synthesis errors
  }
}

/**
 * Gentle UI Hover Blip
 */
export function playHover(): void {
  const ctx = getAudioContext();
  const bus = getSfxBus();
  if (!ctx || !bus) return;

  const now = ctx.currentTime;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);

    osc.connect(gain);
    gain.connect(bus);

    osc.start(now);
    osc.stop(now + 0.008);
  } catch {
    // Ignore
  }
}

/**
 * Aerospace Master Caution Two-Tone Alarm (880 Hz -> 587 Hz)
 */
export function playAlert(): void {
  initAudioOnUserGesture();
  const ctx = getAudioContext();
  const bus = getSfxBus();
  if (!ctx || !bus) return;

  const now = ctx.currentTime;
  const tones = [
    { freq: 880, start: 0, dur: 0.09 },
    { freq: 587.33, start: 0.1, dur: 0.14 },
  ];

  tones.forEach(({ freq, start, dur }) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square"; // Crisp buzzer tone
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.12, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gain);
      gain.connect(bus);

      osc.start(now + start);
      osc.stop(now + start + dur);
    } catch {
      // Ignore
    }
  });
}

/**
 * Achievement / Milestone Fanfare (Ascending 4-tone resonant chime)
 */
export function playAchievement(): void {
  initAudioOnUserGesture();
  const ctx = getAudioContext();
  const bus = getSfxBus();
  if (!ctx || !bus) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0.0, dur: 0.12 }, // C5
    { freq: 659.25, time: 0.1, dur: 0.12 }, // E5
    { freq: 783.99, time: 0.2, dur: 0.14 }, // G5
    { freq: 1046.5, time: 0.32, dur: 0.4 }, // C6
  ];

  notes.forEach(({ freq, time, dur }) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.25, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(bus);

      osc.start(now + time);
      osc.stop(now + time + dur);
    } catch {
      // Ignore
    }
  });
}

/**
 * Apollo / ISS Radio-Squelch Burst (Bandpass noise + tone click)
 */
export function playRadioSquelch(): void {
  const ctx = getAudioContext();
  const bus = getSfxBus();
  if (!ctx || !bus) return;

  const now = ctx.currentTime;
  try {
    // 1. Noise Burst (Bandpass 1200Hz - 2800Hz)
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.07);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(2.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(bus);

    noise.start(now);
    noise.stop(now + 0.07);

    // 2. High-Frequency Quirk Squelch Pop
    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    pop.type = "sine";
    pop.frequency.setValueAtTime(2520, now);
    popGain.gain.setValueAtTime(0.08, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    pop.connect(popGain);
    popGain.connect(bus);

    pop.start(now);
    pop.stop(now + 0.025);
  } catch {
    // Ignore
  }
}

/**
 * Heavy Contact / Impact Thud (Scaled by touchdown velocity)
 */
export function playContactThud(impactVelocityMS = 1.0): void {
  initAudioOnUserGesture();
  const ctx = getAudioContext();
  const bus = getSfxBus();
  if (!ctx || !bus) return;

  const now = ctx.currentTime;
  const intensity = Math.min(1.0, Math.max(0.15, impactVelocityMS / 3.0));

  try {
    // 1. Sub-bass boom
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();

    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(80, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.3);

    subGain.gain.setValueAtTime(0.4 * intensity, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    subOsc.connect(subGain);
    subGain.connect(bus);

    subOsc.start(now);
    subOsc.stop(now + 0.35);

    // 2. Surface impact crack (Lowpassed noise)
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.15);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(450, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3 * intensity, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(bus);

    noise.start(now);
    noise.stop(now + 0.15);
  } catch {
    // Ignore
  }
}

/**
 * Continuous Rocket Engine / Thruster Rumble
 * Throttle: 0.0 (silent) to 1.0 (full thrust)
 */
export function updateThrusterRumble(throttle: number): void {
  const ctx = getAudioContext();
  const bus = getSfxBus();
  if (!ctx || !bus) return;

  const clampedThrottle = Math.max(0, Math.min(1, throttle));
  const now = ctx.currentTime;

  if (clampedThrottle <= 0.01) {
    if (thrusterGain) {
      thrusterGain.gain.setTargetAtTime(0, now, 0.05);
    }
    return;
  }

  // Lazy-initialize continuous looping thruster noise if not already running
  if (!thrusterOsc || !thrusterGain || !thrusterFilter) {
    try {
      const buffer = createNoiseBuffer(ctx, 3.0);
      thrusterOsc = ctx.createBufferSource();
      thrusterOsc.buffer = buffer;
      thrusterOsc.loop = true;

      thrusterFilter = ctx.createBiquadFilter();
      thrusterFilter.type = "lowpass";
      thrusterFilter.frequency.setValueAtTime(140, now);
      thrusterFilter.Q.setValueAtTime(1.2, now);

      thrusterGain = ctx.createGain();
      thrusterGain.gain.setValueAtTime(0, now);

      thrusterOsc.connect(thrusterFilter);
      thrusterFilter.connect(thrusterGain);
      thrusterGain.connect(bus);

      thrusterOsc.start(now);
    } catch {
      return;
    }
  }

  // Modulate filter cutoff (80Hz idle -> 340Hz roar) and gain
  const targetCutoff = 80 + clampedThrottle * 260;
  const targetGain = clampedThrottle * 0.35;

  thrusterFilter.frequency.setTargetAtTime(targetCutoff, now, 0.04);
  thrusterGain.gain.setTargetAtTime(targetGain, now, 0.04);
}
