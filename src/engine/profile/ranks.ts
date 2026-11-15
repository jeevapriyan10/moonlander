/**
 * Pilot Rank and Progression Engine for MoonLander
 * 
 * Implements deterministic XP curve, rank thresholds, and unlock matrix.
 * Supports "Demo Mode: unlock everything" override for evaluations and judges.
 */

import type { PilotRank } from "@/lib/repository/types";

export interface RankTier {
  rank: PilotRank;
  level: number;
  minXp: number;
  maxXp: number | null; // null for top rank (Chief Engineer)
  badgeTitle: string;
  description: string;
  unlockedScenarios: string[];
  unlockedDifficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  unlockedFeatures: string[];
}

export const RANK_TIERS: readonly RankTier[] = [
  {
    rank: "Cadet",
    level: 1,
    minXp: 0,
    maxXp: 1500,
    badgeTitle: "Class IV Trainee",
    description: "Certified for basic Low Earth Orbit observation platforms and subscale satellite architectures.",
    unlockedScenarios: ["earth-watch"],
    unlockedDifficulty: "BEGINNER",
    unlockedFeatures: ["academy", "basic-telemetry", "auto-design"],
  },
  {
    rank: "Flight Controller",
    level: 2,
    minXp: 1500,
    maxXp: 4000,
    badgeTitle: "Console Flight Controller",
    description: "Authorized for Sun-Synchronous wildfire tracking and GEO communications constellations.",
    unlockedScenarios: ["earth-watch", "fire-ice", "geo-relay"],
    unlockedDifficulty: "INTERMEDIATE",
    unlockedFeatures: ["flight-director-log", "porkchop-viewer", "custom-propulsion"],
  },
  {
    rank: "Mission Planner",
    level: 3,
    minXp: 4000,
    maxXp: 8000,
    badgeTitle: "Senior Trajectory Architect",
    description: "Qualified for Sun-Earth L1 space weather sentinels and deep space exoplanet surveys.",
    unlockedScenarios: ["earth-watch", "fire-ice", "geo-relay", "sun-sentinel", "exoplanet-hunter"],
    unlockedDifficulty: "ADVANCED",
    unlockedFeatures: ["solar-system-3d", "cryogenic-instruments", "high-gain-arrays"],
  },
  {
    rank: "Flight Director",
    level: 4,
    minXp: 8000,
    maxXp: 14000,
    badgeTitle: "Lead Flight Director",
    description: "Certified for translunar injection, lunar descent pathfinders, and Martian atmospheric orbiters.",
    unlockedScenarios: [
      "earth-watch",
      "fire-ice",
      "geo-relay",
      "sun-sentinel",
      "exoplanet-hunter",
      "lunar-pathfinder",
      "mars-relay",
    ],
    unlockedDifficulty: "ADVANCED",
    unlockedFeatures: ["autopilot-override", "nuclear-electric-propulsion", "surface-landing-radar"],
  },
  {
    rank: "Program Director",
    level: 5,
    minXp: 14000,
    maxXp: 22000,
    badgeTitle: "Deep Space Program Director",
    description: "Command authorization for outer solar system ice-world reconnaissance and extreme radiation environments.",
    unlockedScenarios: [
      "earth-watch",
      "fire-ice",
      "geo-relay",
      "sun-sentinel",
      "exoplanet-hunter",
      "lunar-pathfinder",
      "mars-relay",
      "ocean-world",
    ],
    unlockedDifficulty: "EXPERT",
    unlockedFeatures: ["rad-hardened-chassis", "laser-optical-comms", "advanced-rtg"],
  },
  {
    rank: "Chief Engineer",
    level: 6,
    minXp: 22000,
    maxXp: null,
    badgeTitle: "Chief Aerospace Architect",
    description: "Master credential with full operational command across all current and future exploratory ventures.",
    unlockedScenarios: [
      "earth-watch",
      "fire-ice",
      "geo-relay",
      "sun-sentinel",
      "exoplanet-hunter",
      "lunar-pathfinder",
      "mars-relay",
      "ocean-world",
    ],
    unlockedDifficulty: "EXPERT",
    unlockedFeatures: ["all-components", "custom-seeds", "sandbox-mastery", "flight-director-override"],
  },
] as const;

/**
 * Returns the RankTier corresponding to the given cumulative XP.
 */
export function getRankForXp(xp: number): RankTier {
  const safeXp = Math.max(0, xp);
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    const tier = RANK_TIERS[i];
    if (tier && safeXp >= tier.minXp) {
      return tier;
    }
  }
  return RANK_TIERS[0]!;
}

/**
 * Calculates current XP progress inside the current rank tier.
 */
export function getXpProgress(xp: number): {
  currentXp: number;
  tierMin: number;
  tierMax: number;
  progressPercent: number;
  xpToNext: number;
  isMaxRank: boolean;
} {
  const tier = getRankForXp(xp);
  const currentXp = Math.max(0, xp);

  if (tier.maxXp === null) {
    return {
      currentXp,
      tierMin: tier.minXp,
      tierMax: tier.minXp,
      progressPercent: 100,
      xpToNext: 0,
      isMaxRank: true,
    };
  }

  const range = tier.maxXp - tier.minXp;
  const earnedInTier = currentXp - tier.minXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((earnedInTier / range) * 100)));
  const xpToNext = Math.max(0, tier.maxXp - currentXp);

  return {
    currentXp,
    tierMin: tier.minXp,
    tierMax: tier.maxXp,
    progressPercent,
    xpToNext,
    isMaxRank: false,
  };
}

/**
 * Determines whether a given scenario is unlocked for the user's rank.
 * If demoMode is active, always returns true.
 */
export function isScenarioUnlocked(
  scenarioId: string,
  currentRank: PilotRank,
  demoMode: boolean = false
): boolean {
  if (demoMode) return true;
  const tierIndex = RANK_TIERS.findIndex((t) => t.rank === currentRank);
  const userLevel = tierIndex >= 0 ? tierIndex + 1 : 1;

  for (let i = 0; i < userLevel; i++) {
    const t = RANK_TIERS[i];
    if (t && t.unlockedScenarios.includes(scenarioId)) {
      return true;
    }
  }
  return false;
}

/**
 * Determines whether a specific feature is unlocked.
 */
export function isFeatureUnlocked(
  feature: string,
  currentRank: PilotRank,
  demoMode: boolean = false
): boolean {
  if (demoMode) return true;
  const tierIndex = RANK_TIERS.findIndex((t) => t.rank === currentRank);
  const userLevel = tierIndex >= 0 ? tierIndex + 1 : 1;

  for (let i = 0; i < userLevel; i++) {
    const t = RANK_TIERS[i];
    if (t && t.unlockedFeatures.includes(feature)) {
      return true;
    }
  }
  return false;
}
