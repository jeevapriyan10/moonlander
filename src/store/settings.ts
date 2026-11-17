import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeStateStorage, STORAGE_KEYS } from "@/lib/storage";

export type CoachMode = "all" | "errors-only" | "off";
export type DifficultyPreference = "YOUTH" | "INTERMEDIATE" | "ADVANCED";
export type GraphicsQuality = "LOW" | "MEDIUM" | "HIGH" | "ULTRA";

export interface SettingsState {
  graphicsQuality: GraphicsQuality;
  reducedMotion: boolean;
  soundEnabled: boolean;
  masterVolume: number; // 0 to 100
  musicVolume: number; // 0 to 100
  sfxVolume: number; // 0 to 100
  capcomTtsEnabled: boolean; // default false (Web Speech TTS)
  closedCaptionsEnabled: boolean; // default true
  bloomEnabled: boolean;
  autoRotate3D: boolean;
  plainLanguage: boolean;
  coachEnabled: boolean;
  coachMode: CoachMode;
  difficultyPreference: DifficultyPreference;
  locale: string; // e.g. "en", "es", "fr", "ja"
  hasCompletedOnboarding: boolean;
  completedLessons: string[];
  unlockedParts: string[];

  setGraphicsQuality: (quality: GraphicsQuality) => void;
  setReducedMotion: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setMasterVolume: (vol: number) => void;
  setMusicVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
  setCapcomTtsEnabled: (enabled: boolean) => void;
  setClosedCaptionsEnabled: (enabled: boolean) => void;
  setBloomEnabled: (enabled: boolean) => void;
  setAutoRotate3D: (enabled: boolean) => void;
  setPlainLanguage: (enabled: boolean) => void;
  setCoachEnabled: (enabled: boolean) => void;
  setCoachMode: (mode: CoachMode) => void;
  setDifficultyPreference: (diff: DifficultyPreference) => void;
  setLocale: (locale: string) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  completeLesson: (lessonId: string) => void;
  unlockPart: (partId: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      graphicsQuality: "HIGH",
      reducedMotion: false,
      soundEnabled: true,
      masterVolume: 80,
      musicVolume: 60,
      sfxVolume: 80,
      capcomTtsEnabled: false,
      closedCaptionsEnabled: true,
      bloomEnabled: true,
      autoRotate3D: true,
      plainLanguage: false,
      coachEnabled: true,
      coachMode: "all",
      difficultyPreference: "INTERMEDIATE",
      locale: "en",
      hasCompletedOnboarding: false,
      completedLessons: [],
      unlockedParts: [],

      setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setMasterVolume: (vol) => set({ masterVolume: Math.max(0, Math.min(100, vol)) }),
      setMusicVolume: (vol) => set({ musicVolume: Math.max(0, Math.min(100, vol)) }),
      setSfxVolume: (vol) => set({ sfxVolume: Math.max(0, Math.min(100, vol)) }),
      setCapcomTtsEnabled: (enabled) => set({ capcomTtsEnabled: enabled }),
      setClosedCaptionsEnabled: (enabled) => set({ closedCaptionsEnabled: enabled }),
      setBloomEnabled: (enabled) => set({ bloomEnabled: enabled }),
      setAutoRotate3D: (enabled) => set({ autoRotate3D: enabled }),
      setPlainLanguage: (enabled) => set({ plainLanguage: enabled }),
      setCoachEnabled: (enabled) => set({ coachEnabled: enabled }),
      setCoachMode: (mode) => set({ coachMode: mode, coachEnabled: mode !== "off" }),
      setDifficultyPreference: (diff) => set({ difficultyPreference: diff }),
      setLocale: (locale) => set({ locale }),
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      completeLesson: (lessonId) =>
        set((state) => ({
          completedLessons: state.completedLessons.includes(lessonId)
            ? state.completedLessons
            : [...state.completedLessons, lessonId],
        })),
      unlockPart: (partId) =>
        set((state) => ({
          unlockedParts: state.unlockedParts.includes(partId)
            ? state.unlockedParts
            : [...state.unlockedParts, partId],
        })),
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      version: 5,
      storage: createJSONStorage(() => safeStateStorage),
      skipHydration: true,
      migrate: (persistedState: unknown, version: number) => {
        if (persistedState && typeof persistedState === "object") {
          const s = persistedState as Partial<SettingsState>;
          return {
            graphicsQuality: s.graphicsQuality ?? "HIGH",
            reducedMotion: s.reducedMotion ?? false,
            soundEnabled: s.soundEnabled ?? true,
            masterVolume: s.masterVolume ?? 80,
            musicVolume: s.musicVolume ?? 60,
            sfxVolume: s.sfxVolume ?? 80,
            capcomTtsEnabled: s.capcomTtsEnabled ?? false,
            closedCaptionsEnabled: s.closedCaptionsEnabled ?? true,
            bloomEnabled: s.bloomEnabled ?? true,
            autoRotate3D: s.autoRotate3D ?? true,
            plainLanguage: s.plainLanguage ?? false,
            coachEnabled: s.coachEnabled ?? true,
            coachMode: s.coachMode ?? "all",
            difficultyPreference: s.difficultyPreference ?? "INTERMEDIATE",
            locale: s.locale ?? "en",
            hasCompletedOnboarding: s.hasCompletedOnboarding ?? false,
            completedLessons: s.completedLessons ?? [],
            unlockedParts: s.unlockedParts ?? [],
          } as SettingsState;
        }
        return persistedState as SettingsState;
      },
    }
  )
);
