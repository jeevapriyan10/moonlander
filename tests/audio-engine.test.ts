import { describe, it, expect, beforeEach } from "vitest";
import {
  initAudioOnUserGesture,
  updateVolumesFromSettings,
  playClick,
  playHover,
  playAlert,
  playAchievement,
  playContactThud,
  playRadioSquelch,
  updateThrusterRumble,
  startAmbientMusic,
  setMusicPhase,
  getMusicPhase,
  stopAmbientMusic,
} from "@/lib/audio";
import { useSettingsStore } from "@/store/settings";

describe("Procedural Audio Engine & Sound Architecture", () => {
  beforeEach(() => {
    // Reset volume state in settings
    useSettingsStore.setState({
      soundEnabled: true,
      masterVolume: 80,
      musicVolume: 60,
      sfxVolume: 80,
    });
  });

  it("handles master, music, and sfx volume updates in settings store", () => {
    useSettingsStore.getState().setMasterVolume(75);
    expect(useSettingsStore.getState().masterVolume).toBe(75);

    useSettingsStore.getState().setMusicVolume(50);
    expect(useSettingsStore.getState().musicVolume).toBe(50);

    useSettingsStore.getState().setSfxVolume(90);
    expect(useSettingsStore.getState().sfxVolume).toBe(90);

    expect(() => updateVolumesFromSettings()).not.toThrow();
  });

  it("handles audio mute toggle gracefully", () => {
    useSettingsStore.getState().setSoundEnabled(false);
    expect(useSettingsStore.getState().soundEnabled).toBe(false);

    useSettingsStore.getState().setSoundEnabled(true);
    expect(useSettingsStore.getState().soundEnabled).toBe(true);
  });

  it("handles user gesture initialization safely in mock environment", () => {
    expect(() => initAudioOnUserGesture()).not.toThrow();
  });

  it("invokes SFX synthesizers without crashing in mocked/headless environment", () => {
    expect(() => playClick()).not.toThrow();
    expect(() => playHover()).not.toThrow();
    expect(() => playAlert()).not.toThrow();
    expect(() => playAchievement()).not.toThrow();
    expect(() => playContactThud(1.5)).not.toThrow();
    expect(() => playContactThud(6.0)).not.toThrow();
    expect(() => playRadioSquelch()).not.toThrow();
  });

  it("updates thruster rumble dynamically with throttle level", () => {
    expect(() => updateThrusterRumble(0)).not.toThrow();
    expect(() => updateThrusterRumble(0.5)).not.toThrow();
    expect(() => updateThrusterRumble(1.0)).not.toThrow();
    expect(() => updateThrusterRumble(-0.1)).not.toThrow();
  });

  it("transitions generative ambient music score through flight phases", () => {
    expect(() => setMusicPhase("calm")).not.toThrow();
    expect(getMusicPhase()).toBe("calm");

    expect(() => setMusicPhase("tense")).not.toThrow();
    expect(getMusicPhase()).toBe("tense");

    expect(() => setMusicPhase("descent")).not.toThrow();
    expect(getMusicPhase()).toBe("descent");

    expect(() => startAmbientMusic()).not.toThrow();
    expect(() => stopAmbientMusic()).not.toThrow();
  });
});
