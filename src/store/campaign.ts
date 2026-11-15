/**
 * Story Campaign State Engine for Meridian Space Authority
 * 
 * Manages narrative chapter progression, reputation tracks (Science, Public, Treasury),
 * and dynamic briefing scenes.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeStateStorage } from "@/lib/storage";
import type { ReputationState } from "@/data/campaign/types";
import { CAMPAIGN_CHAPTERS } from "@/data/campaign/chapters";
import { useProfileStore } from "@/store/profile";
import { useUIStore } from "@/store/ui";

export interface CampaignStoreState {
  completedChapterIds: string[];
  activeChapterId: string;
  reputation: ReputationState;
  budgetModifierM: number;
  deadlineModifierMonths: number;

  // Actions
  setActiveChapter: (id: string) => void;
  applyReputationDelta: (delta: Partial<ReputationState>) => void;
  applyModifiers: (budgetDeltaM: number, deadlineDeltaMonths: number) => void;
  completeChapter: (
    chapterId: string,
    outcome: "success" | "partial" | "failure"
  ) => void;
  resetCampaign: () => void;
}

const DEFAULT_REPUTATION: ReputationState = {
  science: 50,
  public: 50,
  treasury: 50,
};

export const useCampaignStore = create<CampaignStoreState>()(
  persist(
    (set, get) => ({
      completedChapterIds: [],
      activeChapterId: "prologue",
      reputation: { ...DEFAULT_REPUTATION },
      budgetModifierM: 0,
      deadlineModifierMonths: 0,

      setActiveChapter: (id) => {
        set({ activeChapterId: id });
      },

      applyReputationDelta: (delta) => {
        set((state) => ({
          reputation: {
            science: Math.max(0, Math.min(100, state.reputation.science + (delta.science || 0))),
            public: Math.max(0, Math.min(100, state.reputation.public + (delta.public || 0))),
            treasury: Math.max(0, Math.min(100, state.reputation.treasury + (delta.treasury || 0))),
          },
        }));
      },

      applyModifiers: (budgetDeltaM, deadlineDeltaMonths) => {
        set((state) => ({
          budgetModifierM: state.budgetModifierM + budgetDeltaM,
          deadlineModifierMonths: state.deadlineModifierMonths + deadlineDeltaMonths,
        }));
      },

      completeChapter: (chapterId, outcome) => {
        const state = get();
        const chapter = CAMPAIGN_CHAPTERS.find((c) => c.id === chapterId);
        if (!chapter) return;

        const nextCompleted = state.completedChapterIds.includes(chapterId)
          ? state.completedChapterIds
          : [...state.completedChapterIds, chapterId];

        // Award rewards on success
        if (outcome === "success" || outcome === "partial") {
          const profileStore = useProfileStore.getState();
          const xp = outcome === "success" ? chapter.rewards.xp : Math.round(chapter.rewards.xp * 0.7);

          profileStore.addXp(xp, `Completed campaign chapter: ${chapter.title}`);
          get().applyReputationDelta(chapter.rewards.reputation);

          // Story achievements
          if (chapterId === "ch-1") {
            profileStore.unlockAchievement("ach-story-chapter-1");
          }
          if (chapterId === "ch-3") {
            profileStore.unlockAchievement("ach-story-act-1");
          }

          useUIStore.getState().addToast({
            type: "success",
            title: "CAMPAIGN OBJECTIVE CLEARED",
            message: `${chapter.title} successfully logged in Authority archives.`,
          });
        }

        // Determine next chapter in sequence
        const currentIndex = CAMPAIGN_CHAPTERS.findIndex((c) => c.id === chapterId);
        const nextChapter = CAMPAIGN_CHAPTERS[currentIndex + 1];

        set({
          completedChapterIds: nextCompleted,
          activeChapterId: nextChapter ? nextChapter.id : chapterId,
        });
      },

      resetCampaign: () => {
        set({
          completedChapterIds: [],
          activeChapterId: "prologue",
          reputation: { ...DEFAULT_REPUTATION },
          budgetModifierM: 0,
          deadlineModifierMonths: 0,
        });
      },
    }),
    {
      name: "moonlander:campaign",
      storage: createJSONStorage(() => safeStateStorage),
      skipHydration: true,
    }
  )
);
