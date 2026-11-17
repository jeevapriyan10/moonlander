"use client";

/**
 * Web Speech API Text-to-Speech Adapter for CAPCOM Lines
 * 
 * Requirements:
 * - OFF by default (user must explicitly enable in settings)
 * - Plays procedural radio squelch before and after transmission
 * - Tone: slightly lower pitch, crisp aerospace pacing
 */

import { useSettingsStore } from "@/store/settings";
import { playRadioSquelch } from "./sfx";

let isSpeaking = false;

export function speakCapcomMessage(message: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const isEnabled = useSettingsStore.getState().capcomTtsEnabled;
  if (!isEnabled) return;

  // Cancel prior speech queue to avoid backlog
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore
  }

  // Pre-transmission radio squelch burst
  playRadioSquelch();

  setTimeout(() => {
    try {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.05;
      utterance.pitch = 0.88; // Aerospace robotic tactical tone
      utterance.volume = 0.8;

      // Select an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("David"))) ||
        voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        isSpeaking = false;
        // Post-transmission squelch burst
        playRadioSquelch();
      };

      utterance.onerror = () => {
        isSpeaking = false;
      };

      isSpeaking = true;
      window.speechSynthesis.speak(utterance);
    } catch {
      isSpeaking = false;
    }
  }, 90);
}
