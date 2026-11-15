import { describe, it, expect } from "vitest";
import {
  getRankForXp,
  getXpProgress,
  isScenarioUnlocked,
  isFeatureUnlocked,
  RANK_TIERS,
} from "./ranks";

describe("Pilot Rank & Progression Engine", () => {
  it("determines correct rank tier across XP thresholds", () => {
    expect(getRankForXp(0).rank).toBe("Cadet");
    expect(getRankForXp(1499).rank).toBe("Cadet");
    expect(getRankForXp(1500).rank).toBe("Flight Controller");
    expect(getRankForXp(3999).rank).toBe("Flight Controller");
    expect(getRankForXp(4000).rank).toBe("Mission Planner");
    expect(getRankForXp(7999).rank).toBe("Mission Planner");
    expect(getRankForXp(8000).rank).toBe("Flight Director");
    expect(getRankForXp(13999).rank).toBe("Flight Director");
    expect(getRankForXp(14000).rank).toBe("Program Director");
    expect(getRankForXp(21999).rank).toBe("Program Director");
    expect(getRankForXp(22000).rank).toBe("Chief Engineer");
    expect(getRankForXp(100000).rank).toBe("Chief Engineer");
  });

  it("calculates accurate tier progress percentages and XP to next promotion", () => {
    // Cadet: 0 to 1500 XP. At 750 XP, progress should be 50%
    const cadetHalf = getXpProgress(750);
    expect(cadetHalf.progressPercent).toBe(50);
    expect(cadetHalf.xpToNext).toBe(750);
    expect(cadetHalf.isMaxRank).toBe(false);

    // Flight Controller: 1500 to 4000 XP (range 2500). At 2750 XP, earned in tier is 1250 -> 50%
    const fcHalf = getXpProgress(2750);
    expect(fcHalf.progressPercent).toBe(50);
    expect(fcHalf.xpToNext).toBe(1250);

    // Chief Engineer: top tier (max rank)
    const master = getXpProgress(30000);
    expect(master.isMaxRank).toBe(true);
    expect(master.progressPercent).toBe(100);
    expect(master.xpToNext).toBe(0);
  });

  it("correctly evaluates scenario unlocks based on rank", () => {
    // Cadet only has earth-watch
    expect(isScenarioUnlocked("earth-watch", "Cadet")).toBe(true);
    expect(isScenarioUnlocked("mars-relay", "Cadet")).toBe(false);

    // Flight Director has lunar-pathfinder and mars-relay
    expect(isScenarioUnlocked("lunar-pathfinder", "Flight Director")).toBe(true);
    expect(isScenarioUnlocked("mars-relay", "Flight Director")).toBe(true);
    expect(isScenarioUnlocked("ocean-world", "Flight Director")).toBe(false);

    // Program Director and Chief Engineer have ocean-world
    expect(isScenarioUnlocked("ocean-world", "Program Director")).toBe(true);
    expect(isScenarioUnlocked("ocean-world", "Chief Engineer")).toBe(true);
  });

  it("unlocks everything when demoMode is engaged", () => {
    expect(isScenarioUnlocked("ocean-world", "Cadet", true)).toBe(true);
    expect(isScenarioUnlocked("mars-relay", "Cadet", true)).toBe(true);
    expect(isFeatureUnlocked("all-components", "Cadet", true)).toBe(true);
  });
});
