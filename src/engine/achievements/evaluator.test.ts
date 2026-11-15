import { describe, it, expect } from "vitest";
import { checkAchievement, evaluateAllAchievements } from "./evaluator";
import { achievements } from "@/data";
import type { MissionEvaluation } from "@/engine/evaluate";
import type { DebriefReport } from "@/engine/debrief";

describe("Achievement Evaluation DSL Engine", () => {
  const dummyEvaluation = {
    orbit: {
      semiMajorAxisKm: 6878,
      eccentricity: 0.001,
      periodSeconds: 5400,
      orbitsPerDay: 16,
      velocityPerigeeKmS: 7.6,
      velocityApogeeKmS: 7.6,
      eclipseFraction: 0.35,
    },
    mass: {
      structureMassKg: 50,
      busDryMassKg: 100,
      payloadMassKg: 20,
      subsystemsDryMassKg: 30,
      netDryMassKg: 100,
      growthMarginPercent: 15,
      growthMarginKg: 15,
      totalDryMassKg: 115,
      propellantMassKg: 2,
      tankMassKg: 1,
      totalWetMassKg: 118,
      averageTrl: 8,
    },
    power: {
      sunlitGenerationW: 800,
      orbitAverageGenerationW: 520,
      totalLoadW: 180,
      subsystemLoadW: 100,
      instrumentLoadW: 80,
      powerMarginW: 340,
      powerMarginPercent: 180,
      eclipseDurationSeconds: 2100,
      eclipseEnergyWh: 105,
      depthOfDischargeUsed: 0.45,
      batteryCapacityWhRequired: 233,
      batteryCapacityWhInstalled: 500,
      batteryMarginPercent: 114,
      annualCycles: 5800,
      totalMissionCycles: 29000,
    },
    propulsion: {
      propellantMassKg: 2,
      tankMassKg: 1,
      wetPropulsionMassKg: 3,
      deltaVAvailableMs: 2100,
      transferTimeMonthsPenalty: 0,
      breakdown: {
        launchVehicleInjectionMs: 0,
        trajectoryCorrectionMs: 50,
        orbitInsertionMs: 1500,
        planeChangeMs: 0,
        stationKeepingMs: 300,
        momentumDumpingMs: 100,
        deorbitDisposalMs: 100,
        growthMarginPercent: 10,
        totalMissionDeltaVMs: 2050,
      },
    },
    comms: {
      dataGeneratedGbPerDay: 50,
      downlinkCapacityGbPerDay: 80,
      dataReturnFraction: 1.0,
      dailyContactMinutes: 60,
      storageRequiredGb: 50,
      storageInstalledGb: 128,
      storageBufferDays: 2.5,
      storageOverflowRisk: false,
      commsSubsystemMassKg: 15,
      commsPowerW: 45,
      groundNetworkCostM: 5,
    },
    thermal: {
      thermalMassKg: 10,
      thermalPowerW: 20,
      cryoRequirementMet: true,
      costM: 2,
    },
    radiation: {
      annualDoseKrad: 5,
      totalMissionDoseKrad: 25,
      minTidToleranceKrad: 120,
    },
    lifetime: {
      projectedLifetimeYears: 12,
      limitingSubsystem: "solar-array",
    },
    cost: {
      hardwareSubtotalM: 30,
      complexityFactor: 1.1,
      integrationAndTestCostM: 5,
      busBaseCostM: 8,
      launcherPriceM: 6,
      operationsCostM: 6,
      groundNetworkCostM: 5,
      totalMissionCostM: 55,
      budgetCapM: 100,
      budgetVarianceM: -45,
      withinBudget: true,
    },
    schedule: {
      busBaseMonths: 18,
      parallelTechDevelopmentMonths: 6,
      longestLeadItem: "payload",
      transferTimePenaltyMonths: 0,
      totalScheduleMonths: 24,
      deadlineMonths: 36,
      scheduleVarianceMonths: -12,
      withinDeadline: true,
    },
    risk: {
      technicalRiskScore: 10,
      scheduleRiskScore: 5,
      costRiskScore: 5,
      totalRiskScore: 20,
      riskTier: "LOW" as const,
      mitigationRecommendations: [],
    },
    science: {
      totalScienceScore: 120,
      maxPossibleScore: 125,
      percentageScore: 96,
      grade: "S" as const,
      instrumentBreakdown: [
        { instrumentId: "inst-1", rawScore: 40, weight: 1, weightedScore: 40, requirementsMet: true, penalties: [] },
        { instrumentId: "inst-2", rawScore: 40, weight: 1, weightedScore: 40, requirementsMet: true, penalties: [] },
        { instrumentId: "inst-3", rawScore: 40, weight: 1, weightedScore: 40, requirementsMet: true, penalties: [] },
      ],
      requirementsSummary: { totalRequirements: 3, metRequirements: 3, allRequirementsMet: true },
      details: { pointingAccuracyDeg: 0.003 },
    },
    validation: [],
    launchReady: true,
    launchOutcome: { success: true, launchSuccessProbability: 0.98, roll: 0.5 },
  } as unknown as MissionEvaluation;

  const dummyDebrief: DebriefReport = {
    overallScore: 96,
    overallGrade: "S",
    scoreBreakdown: [],
    causalDrivers: [],
    historicalTwin: null,
    whatIfScenarios: [],
    operationalSummary: {
      totalScienceGb: 500,
      anomaliesEncountered: 0,
      anomaliesResolved: 0,
      operationalEfficiencyPercent: 100,
    },
  };

  it("unlocks 'Penny Pincher' when budget spent <= 60%", () => {
    const ach = achievements.find((a) => a.id === "ach-penny-pincher")!;
    expect(ach).toBeDefined();
    const result = checkAchievement(ach, {
      evaluation: dummyEvaluation,
      debriefReport: dummyDebrief,
    });
    expect(result).toBe(true);
  });

  it("unlocks 'Eclipse Survivor' when battery DoD <= 60%", () => {
    const ach = achievements.find((a) => a.id === "ach-eclipse-survivor")!;
    expect(ach).toBeDefined();
    const result = checkAchievement(ach, { evaluation: dummyEvaluation });
    expect(result).toBe(true);
  });

  it("unlocks 'Absolute Chill' when spacecraft carries cryocooled instrument", () => {
    const ach = achievements.find((a) => a.id === "ach-cryo-cool")!;
    expect(ach).toBeDefined();
    const result = checkAchievement(ach, { evaluation: dummyEvaluation });
    expect(result).toBe(true);
  });

  it("unlocks 'Long Haul' when projected lifetime >= 10 years", () => {
    const ach = achievements.find((a) => a.id === "ach-long-haul")!;
    expect(ach).toBeDefined();
    const result = checkAchievement(ach, { evaluation: dummyEvaluation });
    expect(result).toBe(true);
  });

  it("unlocks 'S-Tier Flight Director' on Grade S debrief outcome", () => {
    const ach = achievements.find((a) => a.id === "ach-score-s-rank")!;
    expect(ach).toBeDefined();
    const result = checkAchievement(ach, { debriefReport: dummyDebrief });
    expect(result).toBe(true);
  });

  it("evaluates all achievements and returns newly unlocked list without duplicating existing unlocks", () => {
    const unlocked = evaluateAllAchievements(
      achievements,
      { evaluation: dummyEvaluation, debriefReport: dummyDebrief },
      ["ach-first-boot"]
    );
    expect(unlocked.length).toBeGreaterThan(0);
    // Already unlocked ID should not be returned
    expect(unlocked.some((a) => a.id === "ach-first-boot")).toBe(false);
  });
});
