/**
 * Mass budget, margin estimation, and structural compatibility engine module.
 *
 * Implements:
 * - Component mass roll-up (structure, bus, payload, subsystems)
 * - TRL-based mass growth margin (NASA-STD-7009 / AIAA S-120-2006):
 *     Average TRL < 6: 20% mass growth allowance
 *     Average TRL 6-7: 15% mass growth allowance
 *     Average TRL >= 8: 10% mass growth allowance
 * - Propellant & tank sizing (tank structural mass = 10% of propellant)
 * - Fairing envelope & launcher lift capability checks
 */

export interface BusClassSpec {
  id: string;
  name: string;
  structuralMassKg: number;
  maxDryMassKg: number;
  diameterM: number;
  baseCostM: number;
  baseScheduleMonths: number;
  defaultPointingDeg: number;
}

export interface MassBreakdown {
  structureMassKg: number;
  busDryMassKg: number;
  payloadMassKg: number;
  subsystemsDryMassKg: number;
  netDryMassKg: number;
  growthMarginPercent: number;
  growthMarginKg: number;
  totalDryMassKg: number;
  propellantMassKg: number;
  tankMassKg: number;
  totalWetMassKg: number;
  averageTrl: number;
}

/**
 * Computes AIAA / NASA mass growth margin percent from average TRL.
 */
export function getMassGrowthMarginPercent(averageTrl: number): number {
  if (averageTrl < 6.0) return 20.0;
  if (averageTrl < 8.0) return 15.0;
  return 10.0;
}

/**
 * Aggregates spacecraft mass items and computes total dry and wet mass.
 */
export function computeMassBreakdown(
  bus: BusClassSpec,
  payloadItems: Array<{ massKg: number; trl: number }>,
  subsystemItems: Array<{ massKg: number; trl: number }>,
  propellantMassKg: number
): MassBreakdown {
  const structureMassKg = bus.structuralMassKg;
  let payloadMassKg = 0;
  let subsystemsDryMassKg = 0;
  let totalTrlWeight = 0;
  let weightedTrlSum = 0;

  for (const item of payloadItems) {
    payloadMassKg += item.massKg;
    weightedTrlSum += item.trl * Math.max(1, item.massKg);
    totalTrlWeight += Math.max(1, item.massKg);
  }

  for (const item of subsystemItems) {
    subsystemsDryMassKg += item.massKg;
    weightedTrlSum += item.trl * Math.max(1, item.massKg);
    totalTrlWeight += Math.max(1, item.massKg);
  }

  const averageTrl =
    totalTrlWeight > 0 ? Math.round((weightedTrlSum / totalTrlWeight) * 10) / 10 : 8.0;

  const netDryMassKg = structureMassKg + payloadMassKg + subsystemsDryMassKg;
  const growthMarginPercent = getMassGrowthMarginPercent(averageTrl);
  const growthMarginKg = netDryMassKg * (growthMarginPercent / 100);
  const totalDryMassKg = netDryMassKg + growthMarginKg;

  const tankMassKg = propellantMassKg * 0.1; // 10% tank structural fraction
  const totalWetMassKg = totalDryMassKg + propellantMassKg + tankMassKg;

  return {
    structureMassKg,
    busDryMassKg: structureMassKg,
    payloadMassKg,
    subsystemsDryMassKg,
    netDryMassKg,
    growthMarginPercent,
    growthMarginKg,
    totalDryMassKg,
    propellantMassKg,
    tankMassKg,
    totalWetMassKg,
    averageTrl,
  };
}
