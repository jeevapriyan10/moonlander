/**
 * Electrical Power Subsystem (EPS) calculation module.
 *
 * Implements:
 * - Solar array sizing & degradation:
 *     P_gen_sunlit = S * eta * A * cos(theta_eff) * (1 - degradation/yr)^years
 *     P_gen_avg = P_gen_sunlit * (1 - f_eclipse)
 * - Spacecraft electrical load aggregation (subsystems + instruments * duty cycle)
 * - Eclipse energy & battery capacity sizing:
 *     E_eclipse = P_load * T * f_eclipse (Wh = E / 3600)
 *     batteryWhRequired = E_eclipse_Wh / DoD
 *     DoD limits: LEO 0.30, MEO/HEO 0.50, GEO/Deep 0.60
 * - Battery cycle life evaluation (LEO ~5500 cycles/year vs rated cycle life)
 * - Power margin percentage
 */

import { SOLAR_CONSTANT_EARTH_W_M2 } from "./constants";

export interface SolarArraySpec {
  id: string;
  name: string;
  type: "silicon" | "gaas-triple" | "rtg-nuclear";
  efficiency: number; // 0.20 for Si, 0.29 for GaAs, 1.0 for RTG
  massPerM2Kg: number; // e.g. 3.5 kg/m2 for Si, 2.8 kg/m2 for advanced, 43.0 for MMRTG unit
  costPerM2M: number;
  annualDegradation: number; // e.g. 0.025 / yr, 0.008 for RTG
  trl: number;
}

export interface BatterySpec {
  id: string;
  name: string;
  type: "li-ion-standard" | "li-ion-advanced";
  specificEnergyWhKg: number; // 150 vs 220 Wh/kg
  costPerKWhM: number;
  ratedCyclesAt30DoD: number; // e.g. 35000 vs 60000
  trl: number;
}

export interface PowerEvaluation {
  sunlitGenerationW: number;
  orbitAverageGenerationW: number;
  totalLoadW: number;
  subsystemLoadW: number;
  instrumentLoadW: number;
  powerMarginW: number;
  powerMarginPercent: number;
  eclipseDurationSeconds: number;
  eclipseEnergyWh: number;
  depthOfDischargeUsed: number;
  batteryCapacityWhRequired: number;
  batteryCapacityWhInstalled: number;
  batteryMarginPercent: number;
  annualCycles: number;
  totalMissionCycles: number;
  cycleLifeExceeded: boolean;
  batteryMassKg: number;
  solarArrayMassKg: number;
  totalPowerSystemMassKg: number;
}

/**
 * Returns recommended maximum depth of discharge for an orbit regime.
 */
export function getRecommendedDoD(
  orbitRegime:
    | "LEO"
    | "SSO"
    | "MEO"
    | "GEO"
    | "HEO"
    | "L1"
    | "L2"
    | "LUNAR"
    | "SURFACE"
    | "MARS"
    | "JUPITER"
    | "VENUS"
    | "TITAN"
    | "ASTEROID"
): number {
  switch (orbitRegime) {
    case "LEO":
    case "SSO":
      return 0.3; // High cycles (~5,500/yr), strictly capped at 30% DoD
    case "MEO":
    case "HEO":
      return 0.5;
    case "GEO":
    case "L1":
    case "L2":
    case "LUNAR":
    case "SURFACE":
    case "MARS":
    case "JUPITER":
    case "VENUS":
    case "TITAN":
    case "ASTEROID":
      return 0.6;
    default:
      return 0.3;
  }
}

/**
 * Computes sunlit and orbit-average solar array power generation.
 */
export function computeSolarGeneration(
  arrayAreaM2: number,
  efficiency: number,
  solarFluxW_M2 = SOLAR_CONSTANT_EARTH_W_M2,
  sunIncidenceAngleDeg = 15.0, // effective cosine loss
  annualDegradation = 0.025,
  designLifeYears = 5.0,
  eclipseFraction = 0.369,
  isNuclearRTG = false
): { sunlitGenerationW: number; orbitAverageGenerationW: number } {
  if (arrayAreaM2 <= 0 || efficiency <= 0) {
    return { sunlitGenerationW: 0, orbitAverageGenerationW: 0 };
  }

  // Radioisotope Thermoelectric Generator (MMRTG) delivers continuous decay heat power independent of solar flux and eclipse
  if (isNuclearRTG) {
    const rtgPowerPerUnitArea = 180.0; // Watts per equivalent MMRTG unit area
    const degradationFactor = Math.pow(Math.max(0, 1 - annualDegradation), designLifeYears);
    const steadyPower = arrayAreaM2 * rtgPowerPerUnitArea * degradationFactor;
    return {
      sunlitGenerationW: steadyPower,
      orbitAverageGenerationW: steadyPower, // Continuous decay power, immune to eclipse
    };
  }

  const cosTheta = Math.cos((sunIncidenceAngleDeg * Math.PI) / 180);
  const degradationFactor = Math.pow(Math.max(0, 1 - annualDegradation), designLifeYears);
  const sunlitGenerationW = solarFluxW_M2 * efficiency * arrayAreaM2 * cosTheta * degradationFactor;
  const orbitAverageGenerationW = sunlitGenerationW * (1 - Math.max(0, Math.min(1, eclipseFraction)));

  return {
    sunlitGenerationW,
    orbitAverageGenerationW,
  };
}

/**
 * Sizes battery capacity in Wh based on eclipse duration and electrical load.
 */
export function sizeBattery(
  totalLoadW: number,
  periodSeconds: number,
  eclipseFraction: number,
  targetDoD = 0.3
): { eclipseDurationSeconds: number; eclipseEnergyWh: number; batteryWhRequired: number } {
  const eclipseDurationSeconds = periodSeconds * Math.max(0, Math.min(1, eclipseFraction));
  // Energy consumed during eclipse in Wh: (Watts * seconds) / 3600
  const eclipseEnergyWh = (totalLoadW * eclipseDurationSeconds) / 3600;
  const dod = Math.max(0.05, Math.min(0.9, targetDoD));
  const batteryWhRequired = eclipseEnergyWh / dod;

  return {
    eclipseDurationSeconds,
    eclipseEnergyWh,
    batteryWhRequired,
  };
}
