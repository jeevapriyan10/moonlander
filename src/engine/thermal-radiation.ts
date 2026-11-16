/**
 * Thermal Subsystem, Environmental Radiation (TID), and Mission Lifetime Limiter module.
 *
 * Implements:
 * - Thermal dissipation sizing (fraction of electrical power dissipated as heat)
 * - Cryocooler requirements for Infrared (IR) and scientific focal planes
 * - Total Ionizing Dose (TID) annual exposure per orbit regime (behind standard 3mm Al shielding)
 * - Multi-constraint lifetime evaluation:
 *     Lifetime = min(propellant, battery-cycle, array-degradation, radiation-TID, atmospheric-drag)
 * - Exact reporting of which subsystem or environmental factor is the primary lifetime limiter
 */

export interface ThermalSpec {
  id: string;
  name: string;
  type: "passive" | "heat-pipes" | "cryocooler";
  massFraction: number; // mass as fraction of dry mass (e.g. 0.04 to 0.08)
  heaterPowerW: number;
  coolerPowerW: number;
  costM: number;
  trl: number;
  supportsCryoIR: boolean;
}

export interface FlightComputerSpec {
  id: string;
  name: string;
  tidToleranceKrad: number; // e.g. 15 krad (commercial), 50 krad (rad-tolerant), 100 krad (rad-hard RAD750)
  powerW: number;
  massKg: number;
  costM: number;
  trl: number;
}

export type LifetimeLimiter =
  | "propellant"
  | "battery-cycles"
  | "solar-array-degradation"
  | "radiation-tid"
  | "atmospheric-drag"
  | "design-target";

export interface LifetimeEvaluation {
  projectedLifetimeYears: number;
  limiter: LifetimeLimiter;
  limiterDescription: string;
  propellantLifetimeYears: number;
  batteryLifetimeYears: number;
  solarArrayLifetimeYears: number;
  radiationLifetimeYears: number;
  atmosphericDragLifetimeYears: number;
}

/**
 * Annual Total Ionizing Dose in krad / year behind 3 mm aluminum equivalent.
 * Based on NASA SP-8005 / ECSS-E-ST-10-12C environmental radiation models.
 */
export function getAnnualRadiationDoseKrad(orbitRegime: string): number {
  switch (orbitRegime) {
    case "LEO":
      return 0.5; // low altitude, shielded by geomagnetic field
    case "SSO":
      return 1.5; // polar passes through auroral oval / South Atlantic Anomaly
    case "MEO":
      return 15.0; // severe: trapped electrons in heart of outer Van Allen belt
    case "GEO":
      return 5.0; // outer belt trapped electrons + cosmic rays
    case "HEO":
      return 20.0; // passes repeatedly through both inner & outer radiation belts
    case "L1":
    case "L2":
      return 3.0; // interplanetary cosmic rays + solar energetic particles
    case "LUNAR":
    case "SURFACE":
      return 2.0;
    case "MARS":
      return 1.5;
    case "JUPITER":
      return 20.0; // shielded inside radiation vault on highly eccentric Jovian flyby tour
    case "VENUS":
      return 4.0;
    case "TITAN":
      return 0.8; // shielded by dense atmosphere & Saturn magnetospheric fringe
    case "ASTEROID":
      return 2.5;
    default:
      return 1.5;
  }
}

/**
 * Approximate atmospheric drag orbital lifetime table for circular LEO orbits (years)
 * without active reboost / station-keeping.
 * Assumes typical ballistic coefficient B ~ 50-70 kg/m2 and moderate solar activity.
 */
export function getAtmosphericDragLifetimeYears(altitudeKm: number): number {
  if (altitudeKm < 300) return 0.1;
  if (altitudeKm < 400) return 0.8;
  if (altitudeKm < 500) return 2.5;
  if (altitudeKm < 600) return 8.0;
  if (altitudeKm < 700) return 25.0;
  if (altitudeKm < 800) return 75.0;
  return 999.0; // negligible drag above 800 km
}

/**
 * Evaluates thermal subsystem requirements including cryocooler check for infrared sensors.
 */
export function evaluateThermal(
  dryMassKg: number,
  totalDissipatedPowerW: number,
  requiresCryo: boolean,
  thermalHardware: ThermalSpec
): {
  thermalMassKg: number;
  thermalPowerW: number;
  cryoRequirementMet: boolean;
  costM: number;
} {
  let thermalMassKg = dryMassKg * thermalHardware.massFraction;
  let thermalPowerW = thermalHardware.heaterPowerW;

  if (requiresCryo) {
    thermalMassKg += 12; // cryocooler compressor + cold head
    thermalPowerW += thermalHardware.coolerPowerW > 0 ? thermalHardware.coolerPowerW : 75;
  }

  const cryoRequirementMet = !requiresCryo || thermalHardware.supportsCryoIR;

  return {
    thermalMassKg,
    thermalPowerW,
    cryoRequirementMet,
    costM: thermalHardware.costM,
  };
}

/**
 * Evaluates mission lifetime across all failure and wear mechanisms.
 */
export function evaluateLifetime(
  designLifeYears: number,
  orbitRegime: string,
  altitudeKm: number,
  deltaVAvailableMs: number,
  stationKeepingPerYearMs: number,
  deorbitDisposalMs: number,
  batteryCyclesPerYear: number,
  ratedBatteryCycles: number,
  annualSolarDegradation: number,
  minAllowablePowerFraction: number,
  minTidToleranceKrad: number
): LifetimeEvaluation {
  // 1. Propellant lifetime
  let propellantLifetimeYears = designLifeYears;
  if (stationKeepingPerYearMs > 0) {
    const dvAvailableForSK = Math.max(0, deltaVAvailableMs - deorbitDisposalMs);
    propellantLifetimeYears = dvAvailableForSK / stationKeepingPerYearMs;
  } else {
    propellantLifetimeYears = 99; // no stationkeeping needed
  }

  // 2. Battery cycle lifetime
  let batteryLifetimeYears = 99;
  if (batteryCyclesPerYear > 0) {
    batteryLifetimeYears = ratedBatteryCycles / batteryCyclesPerYear;
  }

  // 3. Solar array degradation lifetime
  // (1 - annualDegradation)^years = minAllowablePowerFraction
  // years = ln(minAllowablePowerFraction) / ln(1 - annualDegradation)
  let solarArrayLifetimeYears = 99;
  if (annualSolarDegradation > 0 && minAllowablePowerFraction < 1) {
    solarArrayLifetimeYears =
      Math.log(minAllowablePowerFraction) / Math.log(1 - annualSolarDegradation);
  }

  // 4. Radiation TID lifetime
  const annualDoseKrad = getAnnualRadiationDoseKrad(orbitRegime);
  const radiationLifetimeYears = annualDoseKrad > 0 ? minTidToleranceKrad / annualDoseKrad : 99;

  // 5. Atmospheric drag decay limit (if no station keeping)
  const atmosphericDragLifetimeYears =
    stationKeepingPerYearMs > 5 ? 99 : getAtmosphericDragLifetimeYears(altitudeKm);

  // Find minimum
  const limits: Array<{ type: LifetimeLimiter; years: number; desc: string }> = [
    {
      type: "propellant",
      years: propellantLifetimeYears,
      desc: "Propellant exhaustion for station-keeping and disposal maneuvers.",
    },
    {
      type: "battery-cycles",
      years: batteryLifetimeYears,
      desc: "Battery cell degradation due to accumulated charge/discharge cycles in eclipse.",
    },
    {
      type: "solar-array-degradation",
      years: solarArrayLifetimeYears,
      desc: "Photovoltaic cell performance loss from space radiation and thermal cycling.",
    },
    {
      type: "radiation-tid",
      years: radiationLifetimeYears,
      desc: "Avionics and flight computer silicon failure from cumulative Total Ionizing Dose.",
    },
    {
      type: "atmospheric-drag",
      years: atmosphericDragLifetimeYears,
      desc: "Orbital decay from atmospheric drag without active altitude maintenance.",
    },
  ];

  let minLimit = limits[0]!;
  for (const item of limits) {
    if (item.years < minLimit.years) {
      minLimit = item;
    }
  }

  const projectedLifetimeYears = Math.min(designLifeYears, minLimit.years);
  const limiter = projectedLifetimeYears < designLifeYears ? minLimit.type : "design-target";
  const limiterDescription =
    projectedLifetimeYears < designLifeYears
      ? minLimit.desc
      : `Nominal completion of ${designLifeYears.toFixed(1)}-year baseline operational mission.`;

  return {
    projectedLifetimeYears: Math.round(projectedLifetimeYears * 10) / 10,
    limiter,
    limiterDescription,
    propellantLifetimeYears: Math.round(propellantLifetimeYears * 10) / 10,
    batteryLifetimeYears: Math.round(batteryLifetimeYears * 10) / 10,
    solarArrayLifetimeYears: Math.round(solarArrayLifetimeYears * 10) / 10,
    radiationLifetimeYears: Math.round(radiationLifetimeYears * 10) / 10,
    atmosphericDragLifetimeYears: Math.round(atmosphericDragLifetimeYears * 10) / 10,
  };
}
