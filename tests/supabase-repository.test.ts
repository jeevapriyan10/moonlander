import { describe, it, expect, beforeEach } from "vitest";
import {
  OfflineWriteQueue,
  SupabaseProfileRepository,
  SupabaseMissionRepository,
  SupabaseHistoryRepository,
} from "@/lib/repository";
import type { ProfileRecord, MissionSave } from "@/lib/repository/types";

describe("Supabase Repository & Offline Write Queue", () => {
  beforeEach(() => {
    OfflineWriteQueue.clearQueue();
  });

  it("handles offline queue operations cleanly", () => {
    expect(OfflineWriteQueue.getQueueLength()).toBe(0);

    OfflineWriteQueue.enqueue({
      type: "SAVE_MISSION",
      id: "test-mission-1",
      payload: {
        id: "test-mission-1",
        seed: "ML-1234",
        name: "Test Mission",
        scenarioId: "earth-watch",
        difficulty: "INTERMEDIATE",
        isSandbox: false,
        busId: "bus-smallsat",
        orbitId: "leo-400",
        launcherId: "falcon-9",
        solarArrayId: "solar-silicon",
        solarArrayAreaM2: 5,
        batteryId: "battery-li-ion-basic",
        batteryCapacityWh: 1000,
        propellantMassKg: 100,
        propulsionId: "prop-cold-gas",
        adcsId: "adcs-magnetorquers",
        flightComputerId: "fc-cots",
        thermalId: "thermal-passive",
        commsId: "comms-s-band",
        groundNetworkId: "net-dedicated-single",
        storageGb: 64,
        selectedInstrumentIds: [],
      },
      timestamp: Date.now(),
    });

    expect(OfflineWriteQueue.getQueueLength()).toBe(1);

    const queue = OfflineWriteQueue.getQueue();
    expect(queue.length).toBeGreaterThan(0);
    const firstAction = queue[0];
    expect(firstAction?.type).toBe("SAVE_MISSION");
    if (firstAction && firstAction.type === "SAVE_MISSION") {
      expect(firstAction.id).toBe("test-mission-1");
    }

    OfflineWriteQueue.clearQueue();
    expect(OfflineWriteQueue.getQueueLength()).toBe(0);
  });

  it("merges remote profile preserving max XP and union of achievements", async () => {
    const profileRepo = new SupabaseProfileRepository();

    const localProfile = await profileRepo.getProfile();

    const remoteProfile: ProfileRecord = {
      ...localProfile,
      xp: localProfile.xp + 500,
      callsign: "Skywatcher",
      unlockedAchievementIds: ["ach-first-orbit", "ach-lunar-touchdown"],
      personalBests: {
        "earth-watch": {
          bestScore: 9500,
          lowestCostM: 85,
          highestScience: 350,
          bestGrade: "S",
          completedCount: 3,
        },
      },
      updatedAt: new Date(Date.now() + 10000).toISOString(),
    };

    const merged = await profileRepo.mergeProfile(remoteProfile);

    expect(merged.xp).toBe(remoteProfile.xp);
    expect(merged.callsign).toBe("Skywatcher");
    expect(merged.unlockedAchievementIds).toContain("ach-first-orbit");
    expect(merged.unlockedAchievementIds).toContain("ach-lunar-touchdown");
    expect(merged.personalBests["earth-watch"]?.bestScore).toBe(9500);
  });

  it("falls back cleanly to local stores when Supabase is unconfigured", async () => {
    const missionRepo = new SupabaseMissionRepository();
    const historyRepo = new SupabaseHistoryRepository();

    const testMission: MissionSave = {
      id: "mission-offline-test",
      seed: "ML-OFFLINE",
      name: "Offline Probe",
      scenarioId: "earth-watch",
      difficulty: "INTERMEDIATE",
      isSandbox: true,
      busId: "bus-smallsat",
      orbitId: "leo-400",
      launcherId: "electron",
      solarArrayId: "solar-silicon",
      solarArrayAreaM2: 4,
      batteryId: "battery-li-ion-basic",
      batteryCapacityWh: 500,
      propellantMassKg: 50,
      propulsionId: "prop-cold-gas",
      adcsId: "adcs-magnetorquers",
      flightComputerId: "fc-cots",
      thermalId: "thermal-passive",
      commsId: "comms-s-band",
      groundNetworkId: "net-dedicated-single",
      storageGb: 64,
      selectedInstrumentIds: [],
    };

    await missionRepo.saveMission(testMission.id, testMission);
    const retrieved = await missionRepo.getMission(testMission.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe("mission-offline-test");

    await missionRepo.deleteMission(testMission.id);
    const afterDelete = await missionRepo.getMission(testMission.id);
    expect(afterDelete).toBeNull();
  });
});
