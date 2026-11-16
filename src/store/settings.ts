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
  bloomEnabled: boolean;
  autoRotate3D: boolean;
  plainLanguage: boolean;
  coachEnabled: boolean;
  coachMode: CoachMode;
  difficultyPreference: DifficultyPreference;
  hasCompletedOnboarding: boolean;
  completedLessons: string[];
  unlockedParts: string[];

  setGraphicsQuality: (quality: GraphicsQuality) => void;
  setReducedMotion: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setBloomEnabled: (enabled: boolean) => void;
  setAutoRotate3D: (enabled: boolean) => void;
  setPlainLanguage: (enabled: boolean) => void;
  setCoachEnabled: (enabled: boolean) => void;
  setCoachMode: (mode: CoachMode) => void;
  setDifficultyPreference: (diff: DifficultyPreference) => void;
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
      bloomEnabled: true,
      autoRotate3D: true,
      plainLanguage: false,
      coachEnabled: true,
      coachMode: "all",
      difficultyPreference: "INTERMEDIATE",
      hasCompletedOnboarding: false,
      completedLessons: [],
      unlockedParts: [],

      setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setBloomEnabled: (enabled) => set({ bloomEnabled: enabled }),
      setAutoRotate3D: (enabled) => set({ autoRotate3D: enabled }),
      setPlainLanguage: (enabled) => set({ plainLanguage: enabled }),
      setCoachEnabled: (enabled) => set({ coachEnabled: enabled }),
      setCoachMode: (mode) => set({ coachMode: mode, coachEnabled: mode !== "off" }),
      setDifficultyPreference: (diff) => set({ difficultyPreference: diff }),
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
      version: 3,
      storage: createJSONStorage(() => safeStateStorage),
      skipHydration: true,
      migrate: (persistedState: unknown, version: number) => {
        if (persistedState && typeof persistedState === "object") {
          const s = persistedState as Partial<SettingsState>;
          return {
            graphicsQuality: s.graphicsQuality ?? "HIGH",
            reducedMotion: s.reducedMotion ?? false,
            soundEnabled: s.soundEnabled ?? true,
            bloomEnabled: s.bloomEnabled ?? true,
            autoRotate3D: s.autoRotate3D ?? true,
            plainLanguage: s.plainLanguage ?? false,
            coachEnabled: s.coachEnabled ?? true,
            coachMode: s.coachMode ?? "all",
            difficultyPreference: s.difficultyPreference ?? "INTERMEDIATE",
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
