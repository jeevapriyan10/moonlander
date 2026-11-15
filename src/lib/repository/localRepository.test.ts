import { describe, it, expect, beforeEach } from "vitest";
import {
  LocalProfileRepository,
  LocalHistoryRepository,
  DEFAULT_PROFILE,
} from "./localRepository";
import type { ProfileRecord, MissionHistoryRecord } from "./types";

describe("Local Repository & Synchronization Engine", () => {
  let profileRepo: LocalProfileRepository;
  let historyRepo: LocalHistoryRepository;

  beforeEach(() => {
    profileRepo = new LocalProfileRepository();
    historyRepo = new LocalHistoryRepository();
  });

  it("loads and saves profile with deterministic rank calculation", async () => {
    const profile: ProfileRecord = {
      ...DEFAULT_PROFILE,
      callsign: "Nova",
      xp: 4500, // Should be Mission Planner
    };

    await profileRepo.saveProfile(profile);
    const loaded = await profileRepo.getProfile();

    expect(loaded.callsign).toBe("Nova");
    expect(loaded.xp).toBe(4500);
    expect(loaded.currentRank).toBe("Mission Planner");
  });

  it("deterministically merges profiles by unioning achievements and maximizing stats", async () => {
    const localProfile: ProfileRecord = {
      ...DEFAULT_PROFILE,
      callsign: "Valkyrie",
      xp: 2000,
      stats: {
        missionsFlown: 5,
        successCount: 4,
        totalSciencePoints: 500,
        totalDeltaVFluwnKmS: 12.5,
        lessonsCompleted: 3,
      },
      unlockedAchievementIds: ["ach-first-boot", "ach-first-certification"],
      updatedAt: "2026-11-01T10:00:00.000Z",
    };

    const remoteProfile: ProfileRecord = {
      ...DEFAULT_PROFILE,
      callsign: "Valkyrie-Prime",
      xp: 8500, // Flight Director
      stats: {
        missionsFlown: 8,
        successCount: 7,
        totalSciencePoints: 950,
        totalDeltaVFluwnKmS: 25.0,
        lessonsCompleted: 6,
      },
      unlockedAchievementIds: ["ach-first-boot", "ach-penny-pincher"],
      updatedAt: new Date(Date.now() + 50000).toISOString(), // Strictly newer than local
    };

    await profileRepo.saveProfile(localProfile);
    const merged = await profileRepo.mergeProfile(remoteProfile);

    // Call sign from newer remote
    expect(merged.callsign).toBe("Valkyrie-Prime");
    // Max XP
    expect(merged.xp).toBe(8500);
    expect(merged.currentRank).toBe("Flight Director");
    // Max stats
    expect(merged.stats.missionsFlown).toBe(8);
    expect(merged.stats.successCount).toBe(7);
    expect(merged.stats.totalSciencePoints).toBe(950);
    // Union of achievements
    expect(merged.unlockedAchievementIds).toContain("ach-first-boot");
    expect(merged.unlockedAchievementIds).toContain("ach-first-certification");
    expect(merged.unlockedAchievementIds).toContain("ach-penny-pincher");
  });

  it("records, retrieves, exports, and imports mission history records", async () => {
    await historyRepo.clearHistory();

    const record: MissionHistoryRecord = {
      id: "rec-test-1",
      missionId: "m-1",
      scenarioId: "earth-watch",
      missionName: "Terra Sentinel 1",
      seed: "ML-TEST-01",
      completedAt: new Date().toISOString(),
      score: 92,
      grade: "A",
      success: true,
      costM: 78.5,
      massKg: 350,
      deltaVKmS: 1.8,
      orbitId: "leo-polar",
      launcherId: "electron",
      debriefSummary: "All systems nominal.",
      debriefReport: {} as any,
      designSnapshot: {} as any,
      updatedAt: new Date().toISOString(),
    };

    await historyRepo.addRecord(record);
    const list = await historyRepo.getHistory();
    expect(list.length).toBe(1);
    expect(list[0]?.missionName).toBe("Terra Sentinel 1");

    // Export to JSON
    const exportedJson = await historyRepo.exportJson();
    expect(exportedJson).toContain("Terra Sentinel 1");

    // Clear and re-import
    await historyRepo.clearHistory();
    expect((await historyRepo.getHistory()).length).toBe(0);

    const importRes = await historyRepo.importJson(exportedJson);
    expect(importRes.imported).toBe(1);
    expect(importRes.skipped).toBe(0);

    const restored = await historyRepo.getHistory();
    expect(restored.length).toBe(1);
    expect(restored[0]?.missionName).toBe("Terra Sentinel 1");
  });
});
