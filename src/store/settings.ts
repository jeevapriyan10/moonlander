import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SettingsState {
  graphicsQuality: "LOW" | "HIGH";
  reducedMotion: boolean;
  soundEnabled: boolean;
  bloomEnabled: boolean;
  autoRotate3D: boolean;
  setGraphicsQuality: (quality: "LOW" | "HIGH") => void;
  setReducedMotion: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setBloomEnabled: (enabled: boolean) => void;
  setAutoRotate3D: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      graphicsQuality: "HIGH",
      reducedMotion: false,
      soundEnabled: true,
      bloomEnabled: true,
      autoRotate3D: true,
      setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setBloomEnabled: (enabled) => set({ bloomEnabled: enabled }),
      setAutoRotate3D: (enabled) => set({ autoRotate3D: enabled }),
    }),
    {
      name: "moonlander-settings-storage-v1",
      version: 1,
    }
  )
);
