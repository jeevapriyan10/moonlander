/**
 * Pilot Profile, Mission History, and Achievement Store for MoonLander
 * 
 * Manages player progression, XP curve, rank credentials, procedural patches,
 * and deterministic achievement unlocks.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeStateStorage, STORAGE_KEYS } from "@/lib/storage";
import { getRankForXp } from "@/engine/profile/ranks";
import type { ProfileRecord, MissionHistoryRecord } from "@/lib/repository/types";
import { DEFAULT_PROFILE } from "@/lib/repository/localRepository";
import { achievements, type Achievement } from "@/data";
import { evaluateAllAchievements, type EvaluationContext } from "@/engine/achievements/evaluator";
import { playAchievementFanfare } from "@/lib/audio/chime";
import { useUIStore } from "./ui";
import type { MissionDesignConfig, MissionEvaluation } from "@/engine/evaluate";
import type { DebriefReport } from "@/engine/debrief";

export interface ProfileStoreState {
  profile: ProfileRecord;
  history: MissionHistoryRecord[];

  // Actions
  setCallsign: (callsign: string) => void;
  setAvatarSeed: (seed: string) => void;
  toggleDemoMode: () => void;
  addXp: (amount: number, reason?: string) => void;
  recordMissionDebrief: (params: {
    missionName: string;
    scenarioId: string;
    seed: string;
    evaluation: MissionEvaluation;
    debriefReport: DebriefReport;
    design: MissionDesignConfig;
    patchSvg?: string;
    logEntries?: Array<{ tPlus: number; message: string; severity?: "info" | "warning" | "critical" }>;
  }) => MissionHistoryRecord;
  unlockAchievement: (achievementId: string) => void;
  evaluateAndUnlock: (ctx: EvaluationContext) => Achievement[];
  deleteHistoryRecord: (id: string) => void;
  clearHistory: () => void;
  exportHistoryJson: () => string;
  importHistoryJson: (json: string) => { imported: number; skipped: number };
}

export const useProfileStore = create<ProfileStoreState>()(
  persist(
    (set, get) => ({
      profile: { ...DEFAULT_PROFILE },
      history: [],

      setCallsign: (callsign) => {
        const trimmed = callsign.trim().slice(0, 24) || "Astro";
        set((state) => ({
          profile: {
            ...state.profile,
            callsign: trimmed,
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      setAvatarSeed: (seed) => {
        set((state) => ({
          profile: {
            ...state.profile,
            avatarSeed: seed,
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      toggleDemoMode: () => {
        const next = !get().profile.demoModeUnlocked;
        set((state) => ({
          profile: {
            ...state.profile,
            demoModeUnlocked: next,
            updatedAt: new Date().toISOString(),
          },
        }));

        useUIStore.getState().addToast({
          type: next ? "warning" : "info",
          title: next ? "DEMO MODE ENGAGED" : "STANDARD FLIGHT RULES",
          message: next
            ? "All scenarios, stages, and propulsion systems unlocked for evaluation."
            : "Progression restrictions restored.",
        });
      },

      addXp: (amount, reason) => {
        if (amount <= 0) return;
        const currentXp = get().profile.xp;
        const nextXp = currentXp + amount;
        const oldRank = getRankForXp(currentXp).rank;
        const newRankTier = getRankForXp(nextXp);

        set((state) => ({
          profile: {
            ...state.profile,
            xp: nextXp,
            currentRank: newRankTier.rank,
            updatedAt: new Date().toISOString(),
          },
        }));

        if (newRankTier.rank !== oldRank) {
          playAchievementFanfare();
          useUIStore.getState().addToast({
            type: "success",
            title: "PROMOTION GRANTED",
            message: `You have attained the rank of ${newRankTier.rank.toUpperCase()}!`,
          });
        } else if (reason) {
          useUIStore.getState().addToast({
            type: "info",
            title: `+${amount} XP EARNED`,
            message: reason,
          });
        }
      },

      recordMissionDebrief: ({
        missionName,
        scenarioId,
        seed,
        evaluation,
        debriefReport,
        design,
        patchSvg,
        logEntries,
      }) => {
        const recordId = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();

        const score = debriefReport.overallScore;
        const grade = debriefReport.overallGrade;
        const isSuccess = score >= 60 && evaluation.launchOutcome.success;

        const historyRecord: MissionHistoryRecord = {
          id: recordId,
          missionId: recordId,
          scenarioId,
          missionName,
          seed,
          completedAt: now,
          score,
          grade,
          success: isSuccess,
          costM: evaluation.cost.totalMissionCostM,
          massKg: evaluation.mass.totalWetMassKg,
          deltaVKmS: evaluation.propulsion.deltaVAvailableMs / 1000,
          orbitId: design.orbitId,
          launcherId: design.launcherId,
          patchSvg,
          debriefSummary: score >= 80 ? "Nominal flight operations and objective execution." : "Partial mission return with anomalous telemetry.",
          debriefReport,
          logEntries: logEntries || [],
          designSnapshot: design,
          updatedAt: now,
        };

        const state = get();
        const prevBests = state.profile.personalBests[scenarioId];
        const newBests = {
          bestScore: prevBests ? Math.max(prevBests.bestScore, score) : score,
          lowestCostM: prevBests ? Math.min(prevBests.lowestCostM, evaluation.cost.totalMissionCostM) : evaluation.cost.totalMissionCostM,
          highestScience: prevBests ? Math.max(prevBests.highestScience, evaluation.science.totalScienceScore) : evaluation.science.totalScienceScore,
          bestGrade: (prevBests && prevBests.bestScore > score) ? prevBests.bestGrade : grade,
          completedCount: (prevBests?.completedCount || 0) + (isSuccess ? 1 : 0),
        };

        const earnedXp = Math.round(score * 8 + (isSuccess ? 400 : 100));

        // Update profile stats and add to history
        set((s) => ({
          history: [historyRecord, ...s.history],
          profile: {
            ...s.profile,
            stats: {
              missionsFlown: s.profile.stats.missionsFlown + 1,
              successCount: s.profile.stats.successCount + (isSuccess ? 1 : 0),
              totalSciencePoints: s.profile.stats.totalSciencePoints + Math.round(evaluation.science.totalScienceScore),
              totalDeltaVFluwnKmS: Math.round((s.profile.stats.totalDeltaVFluwnKmS + (evaluation.propulsion.deltaVAvailableMs / 1000)) * 10) / 10,
              lessonsCompleted: s.profile.stats.lessonsCompleted,
            },
            personalBests: {
              ...s.profile.personalBests,
              [scenarioId]: newBests,
            },
            favoriteOrbit: design.orbitId,
            favoriteLauncher: design.launcherId,
            lastPlayedDate: now.split("T")[0] || null,
            updatedAt: now,
          },
        }));

        get().addXp(earnedXp, `Completed mission ${missionName} (Score: ${debriefReport.overallScore})`);

        // Automatically evaluate all achievements
        get().evaluateAndUnlock({
          evaluation,
          debriefReport,
          scenarioId,
          profile: get().profile,
        });

        return historyRecord;
      },

      unlockAchievement: (achievementId) => {
        const ach = achievements.find((a) => a.id === achievementId);
        if (!ach) return;

        const alreadyUnlocked = get().profile.unlockedAchievementIds.includes(achievementId);
        if (alreadyUnlocked) return;

        const nextIds = [...get().profile.unlockedAchievementIds, achievementId];

        set((s) => ({
          profile: {
            ...s.profile,
            unlockedAchievementIds: nextIds,
            updatedAt: new Date().toISOString(),
          },
        }));

        // Audio & Visual celebratory notification
        playAchievementFanfare();
        useUIStore.getState().addToast({
          type: "success",
          title: "ACHIEVEMENT UNLOCKED",
          message: `${ach.title} (+${ach.xp} XP)`,
        });

        get().addXp(ach.xp);
      },

      evaluateAndUnlock: (ctx) => {
        const state = get();
        const unlocked = evaluateAllAchievements(
          achievements,
          { ...ctx, profile: state.profile },
          state.profile.unlockedAchievementIds
        );

        for (const ach of unlocked) {
          get().unlockAchievement(ach.id);
        }

        return unlocked;
      },

      deleteHistoryRecord: (id) => {
        set((s) => ({
          history: s.history.filter((h) => h.id !== id),
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      exportHistoryJson: () => {
        return JSON.stringify(
          {
            format: "moonlander:history:v1",
            exportedAt: new Date().toISOString(),
            profile: get().profile,
            history: get().history,
          },
          null,
          2
        );
      },

      importHistoryJson: (json) => {
        try {
          const parsed = JSON.parse(json) as {
            history?: MissionHistoryRecord[];
            records?: MissionHistoryRecord[];
          };
          const list = parsed.history || parsed.records || [];
          if (!Array.isArray(list)) return { imported: 0, skipped: 0 };

          const currentMap = new Map(get().history.map((h) => [h.id, h]));
          let imported = 0;
          let skipped = 0;

          for (const item of list) {
            if (!item.id || !item.scenarioId) {
              skipped++;
              continue;
            }
            if (!currentMap.has(item.id)) {
              currentMap.set(item.id, item);
              imported++;
            } else {
              skipped++;
            }
          }

          const merged = Array.from(currentMap.values()).sort(
            (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          );

          set({ history: merged });
          return { imported, skipped };
        } catch {
          return { imported: 0, skipped: 0 };
        }
      },
    }),
    {
      name: STORAGE_KEYS.PROFILE,
      storage: createJSONStorage(() => safeStateStorage),
      skipHydration: true,
    }
  )
);
