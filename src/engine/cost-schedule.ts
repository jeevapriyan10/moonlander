/**
 * Cost modeling, Schedule estimation, and System Risk aggregation engine module.
 *
 * Implements:
 * - Parametric space mission cost model:
 *     Total Cost = [Sum(Component Hardware Costs) * (1 + 0.35 * ComplexityFactor)]
 *                  + Bus Base Cost + Launch Price + (Annual Ops Cost * Life) + Ground Network Cost
 * - Critical-path parallel schedule development model:
 *     Schedule Months = Bus Base Schedule + Max_i( max(0, (7 - TRL_i) * 4) ) + Transfer Time Penalty
 *     (Takes maximum over parallel sub-tier developments rather than sum, per standard aerospace concurrent engineering)
 * - Quantitative mission risk index (0 - 100) combining technology maturity, mass/power margins,
 *   radiation dose headroom, and launcher reliability history.
 */

export interface CostBreakdown {
  hardwareSubtotalM: number;
  complexityFactor: number;
  integrationAndTestCostM: number;
  busBaseCostM: number;
  launcherPriceM: number;
  operationsCostM: number;
  groundNetworkCostM: number;
  totalMissionCostM: number;
  budgetCapM: number;
  budgetVarianceM: number;
  withinBudget: boolean;
}

export interface ScheduleBreakdown {
  busBaseMonths: number;
  parallelTechDevelopmentMonths: number;
  longestLeadItem: string;
  transferTimePenaltyMonths: number;
  totalScheduleMonths: number;
  deadlineMonths: number;
  scheduleVarianceMonths: number;
  withinDeadline: boolean;
}

export interface RiskBreakdown {
  score: number; // 0 (lowest risk) to 100 (highest risk)
  trlRisk: number;
  massMarginRisk: number;
  powerMarginRisk: number;
  radiationRisk: number;
  launcherReliabilityRisk: number;
  riskRating: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  drivers: string[];
}

/**
 * Computes mission complexity factor based on payload count, pointing stringency,
 * active cooling, and propulsion class.
 */
export function computeComplexityFactor(
  instrumentCount: number,
  requiresCryo: boolean,
  isElectricPropulsion: boolean,
  isLaserComms: boolean,
  pointingRequirementDeg: number
): number {
  let complexity = 0.1; // baseline integration overhead
  complexity += Math.min(0.5, (instrumentCount - 1) * 0.12);
  if (requiresCryo) complexity += 0.2;
  if (isElectricPropulsion) complexity += 0.15;
  if (isLaserComms) complexity += 0.15;
  if (pointingRequirementDeg <= 0.01) complexity += 0.2;
  return Math.min(1.0, Math.round(complexity * 100) / 100);
}

/**
 * Computes full mission cost roll-up.
 */
export function computeCostBreakdown(
  hardwareCostsM: number[],
  complexityFactor: number,
  busBaseCostM: number,
  launcherPriceM: number,
  annualOpsCostM: number,
  groundNetworkCostM: number,
  designLifeYears: number,
  budgetCapM: number
): CostBreakdown {
  const hardwareSubtotalM = hardwareCostsM.reduce((sum, cost) => sum + cost, 0);
  const integrationAndTestCostM = hardwareSubtotalM * (0.35 * complexityFactor);
  const operationsCostM = annualOpsCostM * designLifeYears;

  const totalMissionCostM = Math.round(
    (hardwareSubtotalM +
      integrationAndTestCostM +
      busBaseCostM +
      launcherPriceM +
      operationsCostM +
      groundNetworkCostM) *
      100
  ) / 100;

  const budgetVarianceM = Math.round((budgetCapM - totalMissionCostM) * 100) / 100;

  return {
    hardwareSubtotalM,
    complexityFactor,
    integrationAndTestCostM: Math.round(integrationAndTestCostM * 100) / 100,
    busBaseCostM,
    launcherPriceM,
    operationsCostM: Math.round(operationsCostM * 100) / 100,
    groundNetworkCostM: Math.round(groundNetworkCostM * 100) / 100,
    totalMissionCostM,
    budgetCapM,
    budgetVarianceM,
    withinBudget: totalMissionCostM <= budgetCapM,
  };
}

/**
 * Computes mission schedule in months.
 * Parallel items take the max development time: (7 - TRL) * 4 months for TRL < 7.
 */
export function computeScheduleBreakdown(
  busBaseMonths: number,
  componentsWithTrl: Array<{ name: string; trl: number }>,
  transferPenaltyMonths: number,
  deadlineMonths: number
): ScheduleBreakdown {
  let parallelTechDevelopmentMonths = 0;
  let longestLeadItem = "None (All systems >= TRL 7 flight-proven)";

  for (const item of componentsWithTrl) {
    if (item.trl < 7) {
      const devMonths = (7 - item.trl) * 4;
      if (devMonths > parallelTechDevelopmentMonths) {
        parallelTechDevelopmentMonths = devMonths;
        longestLeadItem = `${item.name} (TRL ${item.trl}, +${devMonths} mo)`;
      }
    }
  }

  const totalScheduleMonths = Math.round(
    busBaseMonths + parallelTechDevelopmentMonths + transferPenaltyMonths
  );
  const scheduleVarianceMonths = deadlineMonths - totalScheduleMonths;

  return {
    busBaseMonths,
    parallelTechDevelopmentMonths,
    longestLeadItem,
    transferTimePenaltyMonths: transferPenaltyMonths,
    totalScheduleMonths,
    deadlineMonths,
    scheduleVarianceMonths,
    withinDeadline: totalScheduleMonths <= deadlineMonths,
  };
}

/**
 * Computes composite mission risk index (0 to 100).
 */
export function computeRiskBreakdown(
  componentsWithTrl: Array<{ name: string; trl: number }>,
  dryMassKg: number,
  maxBusDryMassKg: number,
  powerMarginPercent: number,
  projectedRadiationDoseKrad: number,
  lowestTidToleranceKrad: number,
  launcherReliability: number
): RiskBreakdown {
  const drivers: string[] = [];

  // 1. TRL Technology Readiness Risk (up to 30 pts)
  let trlDeficit = 0;
  for (const comp of componentsWithTrl) {
    if (comp.trl < 7) {
      trlDeficit += (7 - comp.trl) * 4;
      drivers.push(`Low TRL tech: ${comp.name} (TRL ${comp.trl})`);
    }
  }
  const trlRisk = Math.min(30, trlDeficit);

  // 2. Mass Margin Risk (up to 25 pts)
  let massMarginRisk = 0;
  const massUsage = maxBusDryMassKg > 0 ? dryMassKg / maxBusDryMassKg : 1.0;
  if (massUsage > 0.95) {
    massMarginRisk = 25;
    drivers.push("Critical mass margin: bus is operating >95% capacity");
  } else if (massUsage > 0.85) {
    massMarginRisk = 12;
    drivers.push("Tight mass margin: bus is operating >85% capacity");
  }

  // 3. Power Margin Risk (up to 20 pts)
  let powerMarginRisk = 0;
  if (powerMarginPercent < 5) {
    powerMarginRisk = 20;
    drivers.push("Deficient power margin (<5% excess generation)");
  } else if (powerMarginPercent < 15) {
    powerMarginRisk = 10;
    drivers.push("Thin power margin (<15% excess generation)");
  }

  // 4. Radiation Dose Risk (up to 15 pts)
  let radiationRisk = 0;
  const radRatio =
    lowestTidToleranceKrad > 0 ? projectedRadiationDoseKrad / lowestTidToleranceKrad : 1.0;
  if (radRatio > 0.9) {
    radiationRisk = 15;
    drivers.push("Extreme radiation dose nearing silicon TID breakdown");
  } else if (radRatio > 0.6) {
    radiationRisk = 8;
    drivers.push("Moderate radiation dose (>60% component TID tolerance)");
  }

  // 5. Launcher Reliability Risk (up to 20 pts)
  // Reliability 0.99 gives ~2 pts, 0.92 gives ~16 pts
  const launcherReliabilityRisk = Math.min(20, Math.round((1 - launcherReliability) * 200));
  if (launcherReliability < 0.94) {
    drivers.push(`Launcher reliability rating ${(launcherReliability * 100).toFixed(0)}%`);
  }

  const rawScore = trlRisk + massMarginRisk + powerMarginRisk + radiationRisk + launcherReliabilityRisk;
  const score = Math.min(100, Math.max(0, rawScore));

  let riskRating: RiskBreakdown["riskRating"] = "LOW";
  if (score > 65) riskRating = "CRITICAL";
  else if (score > 45) riskRating = "HIGH";
  else if (score > 25) riskRating = "MODERATE";

  return {
    score,
    trlRisk,
    massMarginRisk,
    powerMarginRisk,
    radiationRisk,
    launcherReliabilityRisk,
    riskRating,
    drivers,
  };
}
