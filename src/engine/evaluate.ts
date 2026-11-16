/**
 * Main evaluation pipeline for MoonLander.
 *
 * Implements:
 * - Pure, deterministic, zero-allocation evaluation < 5ms
 * - Complete subsystem synthesis: Orbit -> Mass -> Power -> Propulsion -> Comms -> Thermal/Rad -> Cost/Schedule -> Science -> Risk -> Validation -> Launch
 * - Full serializable Evaluation output tree ready for UI gauges, 3D visualizations, and Stage 2 debrief
 */

import {
  calculateSemiMajorAxis,
  calculateEccentricity,
  calculateOrbitalPeriodSeconds,
  calculateOrbitsPerDay,
  calculateCircularVelocity,
  calculateVelocityAtRadius,
  calculateEclipseFraction,
  calculateGroundStationGeometry,
  calculateScaledSwath,
  calculateScaledResolution,
  calculateRevisitDays,
} from "./orbit";
import {
  computeDeltaVBudget,
  calculatePropellantMass,
  calculateDeltaVDelivered,
  computeElectricTransferTimePenaltyMonths,
  type PropulsionEvaluation,
  type PropulsionSpec,
} from "./propulsion";
import {
  computeSolarGeneration,
  sizeBattery,
  getRecommendedDoD,
  type PowerEvaluation,
  type SolarArraySpec,
  type BatterySpec,
} from "./power";
import {
  evaluateComms,
  computeEffectiveContactMinutes,
  type CommsEvaluation,
  type CommsSpec,
  type GroundNetworkSpec,
} from "./comms";
import {
  evaluateThermal,
  evaluateLifetime,
  getAnnualRadiationDoseKrad,
  type LifetimeEvaluation,
  type ThermalSpec,
  type FlightComputerSpec,
} from "./thermal-radiation";
import {
  computeMassBreakdown,
  type MassBreakdown,
  type BusClassSpec,
} from "./mass";
import {
  computeComplexityFactor,
  computeCostBreakdown,
  computeScheduleBreakdown,
  computeRiskBreakdown,
  type CostBreakdown,
  type ScheduleBreakdown,
  type RiskBreakdown,
} from "./cost-schedule";
import {
  evaluateScience,
  type ScienceEvaluation,
  type InstrumentSpec,
} from "./science";
import {
  simulateLaunch,
  type LaunchOutcome,
  type LauncherSpec,
} from "./launch";
import {
  validateMissionDesign,
  type ValidationIssue,
} from "./validate";

export interface OrbitSpec {
  id: string;
  name: string;
  regime: "LEO" | "SSO" | "MEO" | "GEO" | "HEO" | "L1" | "L2" | "LUNAR" | "SURFACE" | "MARS" | "JUPITER" | "VENUS" | "TITAN" | "ASTEROID";
  launcherClassNeeded: "leo" | "sso" | "gto" | "tli" | "tmi";
  perigeeAltKm: number;
  apogeeAltKm: number;
  inclinationDeg: number;
  insertionDvMs: number;
  stationKeepingPerYearMs: number;
  deorbitDisposalMs: number;
  solarFluxW_M2: number;
  annualSolarDegradation: number;
  distanceFromEarthKm: number;
  defaultBetaAngleDeg: number;
  description: string;
}

export interface AdcsSpec {
  id: string;
  name: string;
  pointingAccuracyDeg: number;
  massKg: number;
  powerW: number;
  costM: number;
  trl: number;
}

export interface ScenarioSpec {
  id: string;
  title: string;
  subtitle: string;
  analogue: string;
  briefing: string;
  targetOrbitId: string;
  targetLifeYears: number;
  budgetCapM: number;
  deadlineMonths: number;
  annualOpsCostM: number;
  recommendedInstruments: string[];
  playable: boolean;
}

export interface MissionDesignConfig {
  id: string;
  seed: string;
  name: string;
  scenarioId: string;
  difficulty: "YOUTH" | "INTERMEDIATE" | "ADVANCED";
  isSandbox: boolean;

  // Selected hardware IDs
  busId: string;
  orbitId: string;
  launcherId: string;
  solarArrayId: string;
  solarArrayAreaM2: number;
  batteryId: string;
  batteryCapacityWh: number;
  propulsionId: string;
  propellantMassKg: number;
  adcsId: string;
  flightComputerId: string;
  thermalId: string;
  commsId: string;
  groundNetworkId: string;
  storageGb: number;
  selectedInstrumentIds: string[];
}

export interface MissionEvaluation {
  orbit: {
    semiMajorAxisKm: number;
    eccentricity: number;
    periodSeconds: number;
    orbitsPerDay: number;
    velocityPerigeeKmS: number;
    velocityApogeeKmS: number;
    eclipseFraction: number;
    scaledSwathKm?: number;
    scaledResolutionM?: number;
    revisitDays?: number;
  };
  mass: MassBreakdown;
  power: PowerEvaluation;
  propulsion: PropulsionEvaluation;
  comms: CommsEvaluation;
  thermal: {
    thermalMassKg: number;
    thermalPowerW: number;
    cryoRequirementMet: boolean;
    costM: number;
  };
  radiation: {
    annualDoseKrad: number;
    totalMissionDoseKrad: number;
    minTidToleranceKrad: number;
  };
  lifetime: LifetimeEvaluation;
  cost: CostBreakdown;
  schedule: ScheduleBreakdown;
  risk: RiskBreakdown;
  science: ScienceEvaluation;
  validation: ValidationIssue[];
  launchReady: boolean;
  launchOutcome: LaunchOutcome;
}

export interface CatalogLookup {
  buses: Record<string, BusClassSpec>;
  orbits: Record<string, OrbitSpec>;
  launchers: Record<string, LauncherSpec>;
  solarArrays: Record<string, SolarArraySpec>;
  batteries: Record<string, BatterySpec>;
  propulsions: Record<string, PropulsionSpec>;
  adcsSystems: Record<string, AdcsSpec>;
  flightComputers: Record<string, FlightComputerSpec>;
  thermals: Record<string, ThermalSpec>;
  commsSystems: Record<string, CommsSpec>;
  groundNetworks: Record<string, GroundNetworkSpec>;
  instruments: Record<string, InstrumentSpec>;
  scenarios: Record<string, ScenarioSpec>;
}

/**
 * Pure evaluation function. Recomputes all mission metrics and validations in < 5ms.
 */
export function evaluateMission(
  design: MissionDesignConfig,
  catalog: CatalogLookup
): MissionEvaluation {
  // 1. Resolve Scenario & Orbit
  const scenario = catalog.scenarios[design.scenarioId] ?? {
    id: "custom",
    title: "Custom Scenario",
    subtitle: "",
    analogue: "Generic",
    briefing: "",
    targetOrbitId: "sso-700",
    targetLifeYears: 5,
    budgetCapM: 200,
    deadlineMonths: 48,
    annualOpsCostM: 4.5,
    recommendedInstruments: [],
    playable: true,
  };

  const orbit = catalog.orbits[design.orbitId] ?? Object.values(catalog.orbits)[0]!;
  const bus = catalog.buses[design.busId] ?? Object.values(catalog.buses)[0]!;
  const launcher = catalog.launchers[design.launcherId] ?? Object.values(catalog.launchers)[0]!;
  const solarArray = catalog.solarArrays[design.solarArrayId] ?? Object.values(catalog.solarArrays)[0]!;
  const battery = catalog.batteries[design.batteryId] ?? Object.values(catalog.batteries)[0]!;
  const propulsion = catalog.propulsions[design.propulsionId] ?? Object.values(catalog.propulsions)[0]!;
  const adcs = catalog.adcsSystems[design.adcsId] ?? Object.values(catalog.adcsSystems)[0]!;
  const flightComputer = catalog.flightComputers[design.flightComputerId] ?? Object.values(catalog.flightComputers)[0]!;
  const thermal = catalog.thermals[design.thermalId] ?? Object.values(catalog.thermals)[0]!;
  const comms = catalog.commsSystems[design.commsId] ?? Object.values(catalog.commsSystems)[0]!;
  const groundNetwork = catalog.groundNetworks[design.groundNetworkId] ?? Object.values(catalog.groundNetworks)[0]!;

  const selectedInstruments: InstrumentSpec[] = [];
  for (const id of design.selectedInstrumentIds) {
    const inst = catalog.instruments[id];
    if (inst) selectedInstruments.push(inst);
  }

  // 2. Orbital Mechanics Calculations
  const aKm = calculateSemiMajorAxis(orbit.perigeeAltKm, orbit.apogeeAltKm);
  const ecc = calculateEccentricity(orbit.perigeeAltKm, orbit.apogeeAltKm);
  const periodSec = calculateOrbitalPeriodSeconds(aKm);
  const orbitsPerDay = calculateOrbitsPerDay(periodSec);
  const vPerigee = calculateVelocityAtRadius(6378.137 + orbit.perigeeAltKm, aKm);
  const vApogee = calculateVelocityAtRadius(6378.137 + orbit.apogeeAltKm, aKm);
  let eclipseFraction = 0;
  if (orbit.regime === "L1") {
    eclipseFraction = 0;
  } else if (orbit.regime === "HEO" && orbit.perigeeAltKm > 50000) {
    // High lunar-resonant cislunar orbit (TESS) engineered for zero Earth shadow occultation
    eclipseFraction = 0.002; // occasional brief penumbral grazing (< 40 min / 13.7 days)
  } else if (ecc > 0.2) {
    // For eccentric orbits, eclipse occurs only near perigee at high orbital velocity vPerigee
    // Maximum shadow passage time is bounded by Earth diameter / perigee velocity
    const maxShadowTimeSec = vPerigee > 0 ? (2 * 6378.137) / vPerigee : 3600;
    eclipseFraction = Math.min(0.15, maxShadowTimeSec / periodSec);
  } else {
    eclipseFraction = calculateEclipseFraction(orbit.perigeeAltKm, orbit.defaultBetaAngleDeg);
  }

  // Scaled optical instruments swath / resolution
  let scaledSwathKm: number | undefined;
  let scaledResolutionM: number | undefined;
  let revisitDays: number | undefined;

  for (const inst of selectedInstruments) {
    if (inst.referenceAltitudeKm && inst.referenceResolutionM && inst.referenceSwathKm) {
      scaledSwathKm = calculateScaledSwath(
        inst.referenceSwathKm,
        inst.referenceAltitudeKm,
        orbit.perigeeAltKm
      );
      scaledResolutionM = calculateScaledResolution(
        inst.referenceResolutionM,
        inst.referenceAltitudeKm,
        orbit.perigeeAltKm
      );
      revisitDays = calculateRevisitDays(scaledSwathKm, orbit.perigeeAltKm);
      break;
    }
  }

  // 3. Propulsion & Delta-V
  const deltaVBudget = computeDeltaVBudget(
    orbit.insertionDvMs,
    orbit.stationKeepingPerYearMs,
    scenario.targetLifeYears,
    orbit.deorbitDisposalMs,
    10.0
  );

  // 4. Electrical Power Subsystem
  const isNuclearRTG = solarArray.type === "rtg-nuclear";
  const solarGen = computeSolarGeneration(
    design.solarArrayAreaM2,
    solarArray.efficiency,
    orbit.solarFluxW_M2,
    15.0,
    solarArray.annualDegradation,
    scenario.targetLifeYears,
    eclipseFraction,
    isNuclearRTG
  );

  let instrumentLoadW = 0;
  let requiresCryo = false;
  let mostStringentPointingDeg = 1.0;

  for (const inst of selectedInstruments) {
    instrumentLoadW += inst.avgPowerW * inst.maxDutyCycle;
    if (inst.requiresCryo) requiresCryo = true;
    if (inst.requiredPointingDeg < mostStringentPointingDeg) {
      mostStringentPointingDeg = inst.requiredPointingDeg;
    }
  }

  // Subsystems base power: ADCS + Flight Computer + Comms + Thermal
  const subsystemLoadW =
    adcs.powerW +
    flightComputer.powerW +
    comms.dcPowerW +
    thermal.heaterPowerW +
    (requiresCryo ? (thermal.coolerPowerW > 0 ? thermal.coolerPowerW : 75) : 0);

  const totalLoadW = subsystemLoadW + instrumentLoadW;
  const powerMarginW = solarGen.orbitAverageGenerationW - totalLoadW;
  const powerMarginPercent = totalLoadW > 0 ? (powerMarginW / totalLoadW) * 100 : 0;

  const targetDoD = getRecommendedDoD(orbit.regime);
  const batterySizing = sizeBattery(totalLoadW, periodSec, eclipseFraction, targetDoD);

  const solarArrayMassKg = design.solarArrayAreaM2 * solarArray.massPerM2Kg;
  const batteryMassKg = battery.specificEnergyWhKg > 0 ? design.batteryCapacityWh / battery.specificEnergyWhKg : 0;
  const totalPowerSystemMassKg = solarArrayMassKg + batteryMassKg;

  const annualCycles = orbit.regime === "L1" ? 0 : orbitsPerDay * 365.25 * (eclipseFraction > 0 ? 1 : 0);
  const totalMissionCycles = annualCycles * scenario.targetLifeYears;
  const cycleLifeExceeded = totalMissionCycles > battery.ratedCyclesAt30DoD;

  const powerEval: PowerEvaluation = {
    sunlitGenerationW: Math.round(solarGen.sunlitGenerationW * 10) / 10,
    orbitAverageGenerationW: Math.round(solarGen.orbitAverageGenerationW * 10) / 10,
    totalLoadW: Math.round(totalLoadW * 10) / 10,
    subsystemLoadW: Math.round(subsystemLoadW * 10) / 10,
    instrumentLoadW: Math.round(instrumentLoadW * 10) / 10,
    powerMarginW: Math.round(powerMarginW * 10) / 10,
    powerMarginPercent: Math.round(powerMarginPercent * 10) / 10,
    eclipseDurationSeconds: Math.round(batterySizing.eclipseDurationSeconds),
    eclipseEnergyWh: Math.round(batterySizing.eclipseEnergyWh * 10) / 10,
    depthOfDischargeUsed: targetDoD,
    batteryCapacityWhRequired: Math.round(batterySizing.batteryWhRequired * 10) / 10,
    batteryCapacityWhInstalled: design.batteryCapacityWh,
    batteryMarginPercent:
      batterySizing.batteryWhRequired > 0
        ? Math.round(
            ((design.batteryCapacityWh - batterySizing.batteryWhRequired) /
              batterySizing.batteryWhRequired) *
              100 *
              10
          ) / 10
        : 100,
    annualCycles: Math.round(annualCycles),
    totalMissionCycles: Math.round(totalMissionCycles),
    cycleLifeExceeded,
    batteryMassKg: Math.round(batteryMassKg * 10) / 10,
    solarArrayMassKg: Math.round(solarArrayMassKg * 10) / 10,
    totalPowerSystemMassKg: Math.round(totalPowerSystemMassKg * 10) / 10,
  };

  // 5. Thermal & Radiation
  const thermalEval = evaluateThermal(
    bus.structuralMassKg,
    totalLoadW,
    requiresCryo,
    thermal
  );

  const annualRadDose = getAnnualRadiationDoseKrad(orbit.regime);
  const totalMissionRadDose = annualRadDose * scenario.targetLifeYears;

  // 6. Mass Roll-up
  const payloadMassItems = selectedInstruments.map((inst) => ({
    massKg: inst.massKg,
    trl: inst.trl,
  }));

  const subsystemMassItems = [
    { massKg: solarArrayMassKg, trl: solarArray.trl },
    { massKg: batteryMassKg, trl: battery.trl },
    { massKg: propulsion.dryMassKg, trl: propulsion.trl },
    { massKg: adcs.massKg, trl: adcs.trl },
    { massKg: flightComputer.massKg, trl: flightComputer.trl },
    { massKg: thermalEval.thermalMassKg, trl: thermal.trl },
    { massKg: comms.massKg, trl: comms.trl },
    { massKg: Math.max(1, design.storageGb * 0.005), trl: 9 }, // SSR mass approx ~5g/GB
  ];

  const massBreakdown = computeMassBreakdown(
    bus,
    payloadMassItems,
    subsystemMassItems,
    design.propellantMassKg
  );

  // Propulsion evaluation with final wet mass
  const deltaVDelivered = calculateDeltaVDelivered(
    massBreakdown.totalDryMassKg,
    design.propellantMassKg,
    propulsion.ispSeconds
  );

  const transferTimePenaltyMonths = computeElectricTransferTimePenaltyMonths(
    propulsion.type,
    massBreakdown.totalWetMassKg,
    orbit.insertionDvMs,
    propulsion.thrustN
  );

  const propulsionEval: PropulsionEvaluation = {
    propellantMassKg: design.propellantMassKg,
    tankMassKg: massBreakdown.tankMassKg,
    wetPropulsionMassKg: design.propellantMassKg + massBreakdown.tankMassKg + propulsion.dryMassKg,
    deltaVAvailableMs: Math.round(deltaVDelivered),
    transferTimeMonthsPenalty: transferTimePenaltyMonths,
    breakdown: deltaVBudget,
  };

  // 7. Ground Tracking & Comms
  const contactGeom = calculateGroundStationGeometry(orbit.perigeeAltKm);
  const effectiveContactMinutes = computeEffectiveContactMinutes(
    orbit.regime,
    contactGeom.passesPerDayPerStation,
    contactGeom.meanPassDurationSeconds,
    groundNetwork,
    orbit.distanceFromEarthKm
  );

  const commsEval = evaluateComms(
    selectedInstruments.map((i) => ({ dataRateMbps: i.dataRateMbps, dutyCycle: i.maxDutyCycle })),
    comms,
    groundNetwork,
    design.storageGb,
    effectiveContactMinutes,
    scenario.targetLifeYears
  );

  // 8. Multi-Constraint Lifetime
  const lifetimeEval = evaluateLifetime(
    scenario.targetLifeYears,
    orbit.regime,
    orbit.perigeeAltKm,
    deltaVDelivered,
    orbit.stationKeepingPerYearMs,
    orbit.deorbitDisposalMs,
    annualCycles,
    battery.ratedCyclesAt30DoD,
    solarArray.annualDegradation,
    0.6, // minimum allowable generation fraction (60%)
    flightComputer.tidToleranceKrad
  );

  // 9. Cost & Schedule
  const complexity = computeComplexityFactor(
    selectedInstruments.length,
    requiresCryo,
    propulsion.type === "electric-hall",
    comms.band === "optical-laser",
    mostStringentPointingDeg
  );

  const hardwareCosts = [
    design.solarArrayAreaM2 * solarArray.costPerM2M,
    (design.batteryCapacityWh / 1000) * battery.costPerKWhM,
    propulsion.costM,
    adcs.costM,
    flightComputer.costM,
    thermalEval.costM,
    comms.costM,
    design.storageGb * 0.002,
    ...selectedInstruments.map((i) => i.costM),
  ];

  const costBreakdown = computeCostBreakdown(
    hardwareCosts,
    complexity,
    bus.baseCostM,
    launcher.priceM,
    scenario.annualOpsCostM,
    commsEval.groundNetworkCostM,
    scenario.targetLifeYears,
    scenario.budgetCapM
  );

  const componentsWithTrl = [
    { name: solarArray.name, trl: solarArray.trl },
    { name: battery.name, trl: battery.trl },
    { name: propulsion.name, trl: propulsion.trl },
    { name: adcs.name, trl: adcs.trl },
    { name: flightComputer.name, trl: flightComputer.trl },
    { name: thermal.name, trl: thermal.trl },
    { name: comms.name, trl: comms.trl },
    ...selectedInstruments.map((i) => ({ name: i.name, trl: i.trl })),
  ];

  const scheduleBreakdown = computeScheduleBreakdown(
    bus.baseScheduleMonths,
    componentsWithTrl,
    transferTimePenaltyMonths,
    scenario.deadlineMonths
  );

  // 10. Risk Evaluation
  const riskBreakdown = computeRiskBreakdown(
    componentsWithTrl,
    massBreakdown.totalDryMassKg,
    bus.maxDryMassKg,
    powerMarginPercent,
    totalMissionRadDose,
    flightComputer.tidToleranceKrad,
    launcher.reliability
  );

  // 11. Science Return & Objectives
  const scienceEval = evaluateScience(
    design.scenarioId,
    selectedInstruments,
    design.orbitId,
    orbit.perigeeAltKm,
    lifetimeEval.projectedLifetimeYears,
    scenario.targetLifeYears,
    commsEval.dataReturnFraction,
    adcs.pointingAccuracyDeg,
    scaledResolutionM,
    revisitDays
  );

  // 12. Automated Validation & Diagnostic Rules
  const launcherCapacityForOrbit = launcher.capacityKg[orbit.launcherClassNeeded];

  // Automated machine-applicable fix recommendations:
  // Recommended solar array area to get ~20% power margin
  const minRequiredArrayArea =
    solarArray.efficiency > 0
      ? (totalLoadW * 1.25) /
        (orbit.solarFluxW_M2 *
          solarArray.efficiency *
          Math.cos((15 * Math.PI) / 180) *
          Math.pow(1 - solarArray.annualDegradation, scenario.targetLifeYears) *
          (1 - eclipseFraction))
      : design.solarArrayAreaM2;

  // Find upgrade launcher if overloaded
  let upgradeLauncherId: string | undefined;
  for (const [lId, lSpec] of Object.entries(catalog.launchers)) {
    const cap = lSpec.capacityKg[orbit.launcherClassNeeded];
    if (cap !== null && cap >= massBreakdown.totalWetMassKg && lSpec.fairingDiameterM >= bus.diameterM) {
      upgradeLauncherId = lId;
      break;
    }
  }

  // Find upgrade bus if dry mass exceeded
  let upgradeBusId: string | undefined;
  for (const [bId, bSpec] of Object.entries(catalog.buses)) {
    if (bSpec.maxDryMassKg >= massBreakdown.totalDryMassKg) {
      upgradeBusId = bId;
      break;
    }
  }

  const validationIssues = validateMissionDesign({
    scenarioId: design.scenarioId,
    isSandbox: design.isSandbox,
    busId: design.busId,
    busMaxDryMassKg: bus.maxDryMassKg,
    busDiameterM: bus.diameterM,
    totalDryMassKg: massBreakdown.totalDryMassKg,
    totalWetMassKg: massBreakdown.totalWetMassKg,
    launcherId: design.launcherId,
    launcherCapacityKg: launcherCapacityForOrbit,
    launcherFairingDiameterM: launcher.fairingDiameterM,
    orbitAveragePowerW: solarGen.orbitAverageGenerationW,
    totalLoadW,
    arrayAreaM2: design.solarArrayAreaM2,
    batteryCapacityWhInstalled: design.batteryCapacityWh,
    batteryCapacityWhRequired: batterySizing.batteryWhRequired,
    adcsPointingDeg: adcs.pointingAccuracyDeg,
    requiredPointingDeg: mostStringentPointingDeg,
    storageInstalledGb: design.storageGb,
    storageRequiredGb: commsEval.storageRequiredGb,
    dataReturnFraction: commsEval.dataReturnFraction,
    totalMissionCostM: costBreakdown.totalMissionCostM,
    budgetCapM: scenario.budgetCapM,
    totalScheduleMonths: scheduleBreakdown.totalScheduleMonths,
    deadlineMonths: scenario.deadlineMonths,
    totalDoseKrad: totalMissionRadDose,
    minTidToleranceKrad: flightComputer.tidToleranceKrad,
    requiresCryo,
    hasCryocooler: thermal.supportsCryoIR,
    instrumentCount: selectedInstruments.length,
    recommendedArrayAreaM2: Math.round(minRequiredArrayArea * 10) / 10,
    recommendedBatteryWh: Math.round(batterySizing.batteryWhRequired * 1.15),
    upgradeLauncherId,
    upgradeBusId,
  });

  const hasErrors = validationIssues.some((issue) => issue.severity === "error");
  const launchReady = !hasErrors;

  // 13. Deterministic Seeded Launch Simulation
  const launchOutcome = simulateLaunch(
    launcher,
    riskBreakdown.score,
    design.seed,
    hasErrors,
    launcherCapacityForOrbit !== null && massBreakdown.totalWetMassKg > launcherCapacityForOrbit,
    bus.diameterM > launcher.fairingDiameterM
  );

  return {
    orbit: {
      semiMajorAxisKm: Math.round(aKm * 10) / 10,
      eccentricity: Math.round(ecc * 10000) / 10000,
      periodSeconds: Math.round(periodSec * 10) / 10,
      orbitsPerDay: Math.round(orbitsPerDay * 100) / 100,
      velocityPerigeeKmS: Math.round(vPerigee * 100) / 100,
      velocityApogeeKmS: Math.round(vApogee * 100) / 100,
      eclipseFraction: Math.round(eclipseFraction * 1000) / 1000,
      scaledSwathKm: scaledSwathKm ? Math.round(scaledSwathKm * 10) / 10 : undefined,
      scaledResolutionM: scaledResolutionM ? Math.round(scaledResolutionM * 10) / 10 : undefined,
      revisitDays: revisitDays ? Math.round(revisitDays * 10) / 10 : undefined,
    },
    mass: massBreakdown,
    power: powerEval,
    propulsion: propulsionEval,
    comms: commsEval,
    thermal: thermalEval,
    radiation: {
      annualDoseKrad: annualRadDose,
      totalMissionDoseKrad: Math.round(totalMissionRadDose * 10) / 10,
      minTidToleranceKrad: flightComputer.tidToleranceKrad,
    },
    lifetime: lifetimeEval,
    cost: costBreakdown,
    schedule: scheduleBreakdown,
    risk: riskBreakdown,
    science: scienceEval,
    validation: validationIssues,
    launchReady,
    launchOutcome,
  };
}
