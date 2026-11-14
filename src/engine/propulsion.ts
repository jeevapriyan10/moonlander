/**
 * Propulsion subsystem and Delta-V budget calculations.
 *
 * Implements:
 * - Tsiolkovsky Rocket Equation: m_prop = m_dry * (exp(dv / (Isp * g0)) - 1)
 * - Propellant tank sizing: m_tank = 0.10 * m_prop (10% structural fraction)
 * - Delta-V budget aggregation: insertion + (station-keeping/yr * life) + deorbit/disposal + 10% margin
 * - Electric propulsion transfer time scheduling penalty
 */

import { G0_M_S2 } from "./constants";

export interface PropulsionSpec {
  id: string;
  name: string;
  type: "cold-gas" | "monoprop" | "biprop" | "electric-hall";
  ispSeconds: number;
  dryMassKg: number;
  powerW: number;
  thrustN: number;
  costM: number;
  trl: number;
}

export interface DeltaVBudgetBreakdown {
  insertionDvMs: number;
  stationKeepingPerYearMs: number;
  stationKeepingTotalMs: number;
  deorbitDisposalMs: number;
  subtotalDvMs: number;
  marginPercent: number;
  totalDvRequiredMs: number;
}

export interface PropulsionEvaluation {
  propellantMassKg: number;
  tankMassKg: number;
  wetPropulsionMassKg: number;
  deltaVAvailableMs: number;
  transferTimeMonthsPenalty: number;
  breakdown: DeltaVBudgetBreakdown;
}

/**
 * Calculates propellant mass required to deliver a deltaV to a given dry mass.
 * Tsiolkovsky rocket equation inverted:
 * m_prop = m_dry * (exp(dv / (Isp * g0)) - 1)
 */
export function calculatePropellantMass(
  dryMassKg: number,
  deltaVMs: number,
  ispSeconds: number,
  g0 = G0_M_S2
): number {
  if (deltaVMs <= 0 || dryMassKg <= 0 || ispSeconds <= 0) return 0;
  const exponent = deltaVMs / (ispSeconds * g0);
  return dryMassKg * (Math.exp(exponent) - 1);
}

/**
 * Calculates delta-V delivered by a given propellant mass and dry mass.
 * dv = Isp * g0 * ln((m_dry + m_prop) / m_dry)
 */
export function calculateDeltaVDelivered(
  dryMassKg: number,
  propellantMassKg: number,
  ispSeconds: number,
  g0 = G0_M_S2
): number {
  if (dryMassKg <= 0 || propellantMassKg <= 0 || ispSeconds <= 0) return 0;
  const massRatio = (dryMassKg + propellantMassKg) / dryMassKg;
  return ispSeconds * g0 * Math.log(massRatio);
}

/**
 * Computes complete mission delta-v budget including 10% margin.
 */
export function computeDeltaVBudget(
  insertionDvMs: number,
  stationKeepingPerYearMs: number,
  designLifeYears: number,
  deorbitDisposalMs: number,
  marginPercent = 10.0
): DeltaVBudgetBreakdown {
  const stationKeepingTotalMs = stationKeepingPerYearMs * designLifeYears;
  const subtotalDvMs = insertionDvMs + stationKeepingTotalMs + deorbitDisposalMs;
  const totalDvRequiredMs = subtotalDvMs * (1 + marginPercent / 100);

  return {
    insertionDvMs,
    stationKeepingPerYearMs,
    stationKeepingTotalMs,
    deorbitDisposalMs,
    subtotalDvMs,
    marginPercent,
    totalDvRequiredMs,
  };
}

/**
 * Electric propulsion low-thrust transfer time penalty in months.
 * For high delta-V transfers with low thrust (e.g. Hall thrusters),
 * continuous burn spiraling requires additional months on the mission schedule.
 */
export function computeElectricTransferTimePenaltyMonths(
  propulsionType: string,
  totalWetMassKg: number,
  insertionDvMs: number,
  thrustN: number
): number {
  if (propulsionType !== "electric-hall" || insertionDvMs <= 0 || thrustN <= 0) {
    return 0;
  }
  // Low-thrust acceleration a = T / m (m/s^2)
  // Continuous burn duration t = dv / a seconds
  const avgMassKg = totalWetMassKg * 0.85; // accounts for propellant burn off
  const accel = thrustN / avgMassKg; // m/s^2
  const burnTimeSeconds = insertionDvMs / accel;
  // Convert to months (30 days/month), add duty cycle inefficiency factor (1.4x for Earth shadow/pointing)
  const transferMonths = (burnTimeSeconds / (86400 * 30)) * 1.4;
  return Math.max(0, Math.round(transferMonths * 10) / 10);
}
