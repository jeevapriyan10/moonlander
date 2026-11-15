/**
 * MoonLander Causal Mission Debrief & 100-Point Scoring Engine
 * Pure TypeScript: Deterministic calculation of mission score, grade, causal drivers, and counterfactuals.
 */

import type { MissionDesignConfig, MissionEvaluation } from "./evaluate";
import { evaluateMission } from "./evaluate";
import type { SimulationResult } from "./ops/types";
import { realMissions, type RealMission } from "@/data";
import { getCatalogLookup } from "@/data";

export interface ScoreBreakdownItem {
  category: "science" | "cost" | "schedule" | "reliability" | "operations";
  title: string;
  pointsEarned: number;
  maxPoints: number;
  grade: "S" | "A" | "B" | "C" | "D";
  summary: string;
}

export interface CausalDriver {
  type: "positive" | "negative";
  subsystem: string;
  pointsImpact: number;
  headline: string;
  explanation: string;
  recommendation?: string;
}

export interface WhatIfScenario {
  id: string;
  title: string;
  description: string;
  patch: Partial<MissionDesignConfig>;
  hypotheticalScore: number;
  scoreDelta: number;
  hypotheticalGrade: "S" | "A" | "B" | "C" | "D";
  tradeoffSummary: string;
}

export interface MissionDebriefReport {
  overallScore: number; // 0 - 100
  overallGrade: "S" | "A" | "B" | "C" | "D";
  scoreBreakdown: ScoreBreakdownItem[];
  causalDrivers: CausalDriver[];
  historicalTwin: RealMission | null;
  whatIfScenarios: WhatIfScenario[];
  operationalSummary: {
    totalScienceGb: number;
    anomaliesEncountered: number;
    anomaliesResolved: number;
    operationalEfficiencyPercent: number;
  };
}

export type DebriefReport = MissionDebriefReport;

/**
 * Calculates the comprehensive 100-point mission scorecard.
 */
export function generateMissionDebrief(
  design: MissionDesignConfig,
  evaluation: MissionEvaluation,
  opsResult?: SimulationResult | null
): MissionDebriefReport {
  // 1. Science Return (0 - 30 Points)
  const scienceRaw = evaluation.science.percentageScore; // 0 - 100%
  const sciencePts = Math.min(30, Math.round((scienceRaw / 100) * 30 * 10) / 10);

  // 2. Cost Efficiency (0 - 25 Points)
  // 25 pts if at or under 80% of budget cap, scaling down to 10 at budget cap, 0 if over budget
  const costRatio = evaluation.cost.totalMissionCostM / Math.max(1, evaluation.cost.budgetCapM);
  let costPts = 0;
  if (costRatio <= 0.8) {
    costPts = 25;
  } else if (costRatio <= 1.0) {
    costPts = Math.round((25 - ((costRatio - 0.8) / 0.2) * 12) * 10) / 10;
  } else {
    costPts = Math.max(0, Math.round((10 - (costRatio - 1.0) * 30) * 10) / 10);
  }

  // 3. Schedule Adherence (0 - 20 Points)
  const schedRatio = evaluation.schedule.totalScheduleMonths / Math.max(1, evaluation.schedule.deadlineMonths);
  let schedPts = 0;
  if (schedRatio <= 0.85) {
    schedPts = 20;
  } else if (schedRatio <= 1.0) {
    schedPts = Math.round((20 - ((schedRatio - 0.85) / 0.15) * 8) * 10) / 10;
  } else {
    schedPts = Math.max(0, Math.round((8 - (schedRatio - 1.0) * 20) * 10) / 10);
  }

  // 4. System Reliability & Risk (0 - 15 Points)
  const riskScore = evaluation.risk.score; // 0 - 100 (lower is better)
  const relPts = Math.max(0, Math.round((15 - (riskScore / 100) * 12) * 10) / 10);

  // 5. Operational Execution (0 - 10 Points)
  const opsEfficiency = opsResult?.operationalEfficiencyPercent ?? 92;
  const anomaliesHandled = opsResult?.anomaliesResolved ?? 2;
  const anomaliesTotal = opsResult?.anomaliesEncountered ?? 2;
  const resolutionRatio = anomaliesTotal > 0 ? anomaliesHandled / anomaliesTotal : 1.0;
  const opsPts = Math.min(10, Math.round(((opsEfficiency / 100) * 6 + resolutionRatio * 4) * 10) / 10);

  // Total composite score
  const totalScore = Math.min(100, Math.max(0, Math.round(sciencePts + costPts + schedPts + relPts + opsPts)));

  const overallGrade: "S" | "A" | "B" | "C" | "D" =
    totalScore >= 92 ? "S" : totalScore >= 82 ? "A" : totalScore >= 70 ? "B" : totalScore >= 55 ? "C" : "D";

  // Score breakdown matrix
  const scoreBreakdown: ScoreBreakdownItem[] = [
    {
      category: "science",
      title: "Science Return",
      pointsEarned: sciencePts,
      maxPoints: 30,
      grade: sciencePts >= 27 ? "S" : sciencePts >= 24 ? "A" : sciencePts >= 20 ? "B" : "C",
      summary: `${evaluation.science.requirementsSummary.metRequirements} of ${evaluation.science.requirementsSummary.totalRequirements} charter science requirements fulfilled.`,
    },
    {
      category: "cost",
      title: "Cost Efficiency",
      pointsEarned: costPts,
      maxPoints: 25,
      grade: costPts >= 23 ? "S" : costPts >= 19 ? "A" : costPts >= 15 ? "B" : "C",
      summary: `$${evaluation.cost.totalMissionCostM.toFixed(1)}M spent vs $${evaluation.cost.budgetCapM}M authorized funding cap.`,
    },
    {
      category: "schedule",
      title: "Schedule Delivery",
      pointsEarned: schedPts,
      maxPoints: 20,
      grade: schedPts >= 18 ? "S" : schedPts >= 15 ? "A" : schedPts >= 12 ? "B" : "C",
      summary: `${evaluation.schedule.totalScheduleMonths} months development cycle against ${evaluation.schedule.deadlineMonths} mo hard deadline.`,
    },
    {
      category: "reliability",
      title: "System Reliability",
      pointsEarned: relPts,
      maxPoints: 15,
      grade: relPts >= 13 ? "S" : relPts >= 11 ? "A" : relPts >= 8 ? "B" : "C",
      summary: `Risk index scored at ${riskScore}/100 with ${(evaluation.launchOutcome.probability * 100).toFixed(1)}% launch reliability.`,
    },
    {
      category: "operations",
      title: "On-Orbit Operations",
      pointsEarned: opsPts,
      maxPoints: 10,
      grade: opsPts >= 9 ? "S" : opsPts >= 8 ? "A" : opsPts >= 7 ? "B" : "C",
      summary: `${anomaliesHandled}/${anomaliesTotal} on-orbit anomalies resolved with ${opsEfficiency}% telemetry efficiency.`,
    },
  ];

  // 6. Causal Failure & Success Driver Attribution
  const causalDrivers: CausalDriver[] = [];

  // Science / payload driver
  if (evaluation.comms.dataReturnFraction >= 0.95) {
    causalDrivers.push({
      type: "positive",
      subsystem: "Telecommunications",
      pointsImpact: 8,
      headline: "High-Bandwidth Downlink Prevented Science Bottlenecks",
      explanation: `Ground station link throughput of ${evaluation.comms.downlinkCapacityGbPerDay.toFixed(1)} GB/day ensured ${(evaluation.comms.dataReturnFraction * 100).toFixed(0)}% of gathered observations were returned without onboard buffer overflow.`,
    });
  } else {
    causalDrivers.push({
      type: "negative",
      subsystem: "Telecommunications",
      pointsImpact: -6,
      headline: "Downlink Capacity Throttled Scientific Return",
      explanation: `Only ${(evaluation.comms.dataReturnFraction * 100).toFixed(0)}% of payload science was successfully downlinked. Storage buffer fill necessitated observational load-shedding.`,
      recommendation: "Upgrade to Ka-band transmitter or add commercial ground tracking stations.",
    });
  }

  // Power / battery driver
  if (evaluation.power.powerMarginPercent >= 25) {
    causalDrivers.push({
      type: "positive",
      subsystem: "Electrical Power System",
      pointsImpact: 7,
      headline: "Robust Solar Generation Across Orbital Seasons",
      explanation: `Solar array delivered +${evaluation.power.powerMarginPercent.toFixed(0)}% power margin above all payload and bus loads throughout eclipse cycles.`,
    });
  } else if (evaluation.power.powerMarginPercent < 0) {
    causalDrivers.push({
      type: "negative",
      subsystem: "Electrical Power System",
      pointsImpact: -8,
      headline: "Negative Orbit-Average Power Margin",
      explanation: `Solar generation was insufficient to balance subsystem draw during orbital night, placing severe drain on battery cycles.`,
      recommendation: "Increase solar array area or transition to high-efficiency triple-junction GaAs cells.",
    });
  }

  // Cost driver
  if (evaluation.cost.withinBudget) {
    const marginM = evaluation.cost.budgetCapM - evaluation.cost.totalMissionCostM;
    causalDrivers.push({
      type: "positive",
      subsystem: "Lifecycle Economics",
      pointsImpact: 6,
      headline: `Under Budget Delivery (+$${marginM.toFixed(1)}M Surplus)`,
      explanation: `Careful bus component matching and launch vehicle pricing yielded substantial cost reserves for agency reinvestment.`,
    });
  } else {
    const overrunM = evaluation.cost.totalMissionCostM - evaluation.cost.budgetCapM;
    causalDrivers.push({
      type: "negative",
      subsystem: "Lifecycle Economics",
      pointsImpact: -10,
      headline: `Budget Cap Overrun (-$${overrunM.toFixed(1)}M Deficit)`,
      explanation: `Hardware acquisition and launcher price exceeded congressional funding authorization.`,
      recommendation: "Downgrade bus class or choose a more cost-effective launcher.",
    });
  }

  // 7. Find NASA Historical Twin
  const historicalTwin = realMissions.find((m) => m.scenarioId === design.scenarioId) ?? realMissions[0] ?? null;

  // 8. Generate Counterfactual What-Ifs
  const catalog = getCatalogLookup();
  const whatIfScenarios: WhatIfScenario[] = [];

  // What-If 1: High-Rate Comms Upgrade
  if (design.commsId !== "comms-ka-band") {
    const patch = { commsId: "comms-ka-band" };
    const hypEval = evaluateMission({ ...design, ...patch }, catalog);
    const hypReport = generateMissionDebrief({ ...design, ...patch }, hypEval, opsResult);
    whatIfScenarios.push({
      id: "whatif-ka-band",
      title: "Upgrade to Ka-Band High-Rate Transponder",
      description: "Equip steerable Ka-band high-gain antenna delivering up to 150 Mbps downlink.",
      patch,
      hypotheticalScore: hypReport.overallScore,
      scoreDelta: hypReport.overallScore - totalScore,
      hypotheticalGrade: hypReport.overallGrade,
      tradeoffSummary: "Increases data return by ~25% at a minor power and mass trade-off.",
    });
  }

  // What-If 2: Tripled Battery Capacity
  if (design.batteryCapacityWh < 2000) {
    const patch = { batteryCapacityWh: Math.round(design.batteryCapacityWh * 1.8) };
    const hypEval = evaluateMission({ ...design, ...patch }, catalog);
    const hypReport = generateMissionDebrief({ ...design, ...patch }, hypEval, opsResult);
    whatIfScenarios.push({
      id: "whatif-battery-boost",
      title: "Enlarge Battery Capacity (+80% Wh)",
      description: "Add lithium-ion cell strings to suppress depth-of-discharge during deep eclipses.",
      patch,
      hypotheticalScore: hypReport.overallScore,
      scoreDelta: hypReport.overallScore - totalScore,
      hypotheticalGrade: hypReport.overallGrade,
      tradeoffSummary: "Improves battery life and reduces eclipse thermal stress with +12 kg mass growth.",
    });
  }

  // What-If 3: Falcon Heavy Launcher Upgrade
  if (design.launcherId !== "falcon-heavy") {
    const patch = { launcherId: "falcon-heavy" };
    const hypEval = evaluateMission({ ...design, ...patch }, catalog);
    const hypReport = generateMissionDebrief({ ...design, ...patch }, hypEval, opsResult);
    whatIfScenarios.push({
      id: "whatif-heavy-lift",
      title: "Upgrade to Falcon Heavy Launch Vehicle",
      description: "Switch to 63,800 kg LEO heavy-lift vehicle with 5.2m fairing.",
      patch,
      hypotheticalScore: hypReport.overallScore,
      scoreDelta: hypReport.overallScore - totalScore,
      hypotheticalGrade: hypReport.overallGrade,
      tradeoffSummary: "Eliminates all mass limits but adds $45M to launch services budget.",
    });
  }

  return {
    overallScore: totalScore,
    overallGrade,
    scoreBreakdown,
    causalDrivers,
    historicalTwin,
    whatIfScenarios,
    operationalSummary: {
      totalScienceGb: opsResult?.totalScienceGb ?? evaluation.comms.dataGeneratedGbPerDay * 365,
      anomaliesEncountered: opsResult?.anomaliesEncountered ?? 2,
      anomaliesResolved: opsResult?.anomaliesResolved ?? 2,
      operationalEfficiencyPercent: opsResult?.operationalEfficiencyPercent ?? 94,
    },
  };
}
