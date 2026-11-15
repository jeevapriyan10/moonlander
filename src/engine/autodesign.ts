/**
 * MoonLander Autonomous Systems Engineering (Auto-Design) Engine
 *
 * Implements pure deterministic synthesis of certified spacecraft configurations
 * given a mission scenario, player difficulty, and design preference optimization objective:
 * - "cheapest": Minimizes lifecycle cost while meeting all hard constraints
 * - "safest": Maximizes mass, power, and thermal margins while minimizing risk
 * - "best-science": Maximizes data return and payload science capability
 *
 * Returns the synthesized MissionDesignConfig alongside an educational, plain-language
 * explanation for every component selected so the user learns why the choice was made.
 */

import { evaluateMission, type MissionDesignConfig, type MissionEvaluation } from "./evaluate";
import { getCatalogLookup } from "../data";
import { generateSeedCode } from "./rng";

export type AutoDesignPreference = "cheapest" | "safest" | "best-science";

export interface AutoDesignResult {
  config: MissionDesignConfig;
  evaluation: MissionEvaluation;
  explanations: Record<string, string>;
  rationaleSummary: string[];
}

export function autoDesign(
  scenarioId: string,
  difficulty: "YOUTH" | "INTERMEDIATE" | "ADVANCED" = "INTERMEDIATE",
  preference: AutoDesignPreference = "cheapest",
  seed?: string
): AutoDesignResult {
  const catalog = getCatalogLookup();
  const scenario = catalog.scenarios[scenarioId] ?? Object.values(catalog.scenarios)[0]!;

  const missionSeed = seed ?? generateSeedCode();
  const missionId = `ml-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // 1. Determine target orbit from scenario
  const orbitId = scenario.targetOrbitId || "sso-700";
  const targetOrbit = catalog.orbits[orbitId];
  const isHighEnergyOrbit = orbitId.startsWith("heo") || orbitId.startsWith("geo") || orbitId.startsWith("gto") || orbitId.startsWith("tli");

  // 2. Select Payload Instruments
  let selectedInstrumentIds: string[] = [];
  const explanations: Record<string, string> = {};
  const rationaleSummary: string[] = [];

  if (scenarioId === "earth-watch") {
    if (preference === "best-science") {
      selectedInstrumentIds = ["inst-multispectral", "inst-thermal-ir"];
      explanations.payload = "Paired Multispectral Imager with Thermal Infrared Sensor for dual land cover mapping and cryogenic drought stress monitoring.";
    } else {
      selectedInstrumentIds = ["inst-multispectral"];
      explanations.payload = "Equipped Operational Land Imager (OLI) delivering 30-meter resolution across 9 spectral bands to fulfill primary observation requirements.";
    }
  } else if (scenarioId === "exoplanet-hunter") {
    selectedInstrumentIds = ["inst-transit-photometer"];
    if (preference === "best-science") {
      explanations.payload = "Equipped Wide-Field Transit Photometer (2,304 deg² FOV) paired with ultra-fine pointing bench and high-speed Ka-band downlink to maximize photometric observation return.";
    } else {
      explanations.payload = "Selected Wide-Field Transit Photometer providing 2,304 deg² celestial FOV for continuous planetary transit monitoring.";
    }
  } else {
    // Default from scenario recommendations
    selectedInstrumentIds = scenario.recommendedInstruments && scenario.recommendedInstruments.length > 0
      ? [scenario.recommendedInstruments[0]!]
      : ["inst-multispectral"];
    explanations.payload = "Selected certified primary payload instrument meeting mission charter specifications.";
  }

  // Calculate total payload mass and pointing stringency
  let totalPayloadMassKg = 0;
  let requiredPointingDeg = 0.05;
  let needsCryo = false;

  for (const instId of selectedInstrumentIds) {
    const inst = catalog.instruments[instId];
    if (inst) {
      totalPayloadMassKg += inst.massKg;
      if (inst.requiredPointingDeg < requiredPointingDeg) {
        requiredPointingDeg = inst.requiredPointingDeg;
      }
      if (inst.requiresCryo) {
        needsCryo = true;
      }
    }
  }

  // 3. Select Bus Structure
  let busId = "bus-smallsat";
  if (totalPayloadMassKg > 400 || preference === "safest") {
    busId = "bus-midsize";
    explanations.bus = "Selected Mid-Size EELV bus to provide heavy structural load capability, large array mounting area, and expansive thermal radiators.";
  } else if (totalPayloadMassKg > 100) {
    busId = "bus-smallsat";
    explanations.bus = "Selected ESPA-Class SmallSat bus to host payload instruments within mass budget and certified structural margin.";
  } else {
    busId = "bus-microsat";
    explanations.bus = "Selected MicroSat bus to minimize spacecraft dry mass and launch costs.";
  }

  explanations.orbit = `Targeted ${targetOrbit?.name ?? orbitId} per mission operational profile requirements.`;

  // 4. Power & Battery Sizing
  let solarArrayId = "solar-silicon";
  let solarArrayAreaM2 = 2.4;
  let batteryId = "battery-li-ion-std";
  let batteryCapacityWh = 300;

  if (preference === "safest") {
    solarArrayId = "solar-gaas-triple";
    solarArrayAreaM2 = 3.2;
    batteryCapacityWh = 450;
    explanations.power = "Configured high-efficiency Triple-Junction GaAs arrays (30% efficiency) and 450 Wh battery storage to maintain high power margin.";
  } else {
    solarArrayId = "solar-silicon";
    solarArrayAreaM2 = 2.4;
    batteryCapacityWh = 320;
    explanations.power = "Configured Silicon solar arrays with 320 Wh battery bank for an economical, balanced power architecture.";
  }

  // 5. Propulsion System Sizing
  let propulsionId = "prop-monoprop";
  let propellantMassKg = 20;

  if (isHighEnergyOrbit && preference === "safest") {
    propulsionId = "prop-biprop";
    propellantMassKg = 40;
    explanations.propulsion = "Selected Dual-Mode Bipropellant engine (Isp 310s) with 40 kg propellant to provide robust delta-v margin for orbital maneuvering.";
  } else if (preference === "best-science") {
    propulsionId = "prop-monoprop";
    propellantMassKg = 25;
    explanations.propulsion = "Selected Monopropellant Hydrazine thrusters (Isp 220s) with 25 kg propellant reserve for multi-year orbit maintenance.";
  } else {
    propulsionId = "prop-monoprop";
    propellantMassKg = 18;
    explanations.propulsion = "Selected Monopropellant Hydrazine thrusters for cost-effective orbit maintenance and reaction wheel momentum desaturation.";
  }

  // 6. ADCS & Guidance
  let adcsId = "adcs-reaction-wheels";
  if (requiredPointingDeg < 0.01 || preference === "safest") {
    adcsId = "adcs-fine-pointing";
    explanations.avionics = "Equipped Ultra-Fine Pointing Bench (0.001° accuracy) with star trackers to eliminate optical motion blur during observations.";
  } else {
    adcsId = "adcs-reaction-wheels";
    explanations.avionics = "Equipped 3-axis Reaction Wheels with Dual Star Trackers for stable 0.01° pointing accuracy.";
  }

  const flightComputerId = preference === "safest" ? "fc-fault-tolerant-dual" : "fc-rad-tolerant";
  const thermalId = needsCryo ? "thermal-cryo" : "thermal-passive";
  const commsId = "comms-ka-band";
  const groundNetworkId = "net-commercial-global";
  const storageGb = 512;

  explanations.comms = "Equipped Ka-band high-throughput transmitter with Global Commercial Ground Network ensuring >=90% daily science data downlink return.";

  // 7. Launcher Vehicle Selection
  let launcherId = "falcon-9";
  if (isHighEnergyOrbit) {
    launcherId = "falcon-9";
    explanations.launcher = "Selected Falcon 9 for high-energy upper stage insertion into high-eccentricity target orbit.";
  } else if (preference === "cheapest" && busId !== "bus-heavy") {
    launcherId = "vega-c";
    explanations.launcher = "Selected Vega-C light-medium launcher to minimize launch services expenditure while delivering required lift capacity.";
  } else {
    launcherId = "falcon-9";
    explanations.launcher = "Selected Falcon 9 heavy-lift vehicle for 99% certified flight reliability and massive payload mass headroom.";
  }

  const config: MissionDesignConfig = {
    id: missionId,
    seed: missionSeed,
    name: `${scenario.title || scenarioId} Auto-Forge`,
    scenarioId,
    difficulty,
    isSandbox: false,
    busId,
    orbitId,
    launcherId,
    solarArrayId,
    solarArrayAreaM2,
    batteryId,
    batteryCapacityWh,
    propulsionId,
    propellantMassKg,
    adcsId,
    flightComputerId,
    thermalId,
    commsId,
    groundNetworkId,
    storageGb,
    selectedInstrumentIds,
  };

  // Evaluate candidate configuration
  let evaluation = evaluateMission(config, catalog);

  // Iterative self-healing loop: if errors exist, apply top recommended fixes
  let maxPasses = 5;
  while (!evaluation.launchReady && maxPasses > 0) {
    maxPasses--;
    let appliedAny = false;
    for (const issue of evaluation.validation) {
      if (issue.severity === "error" && issue.fixes && issue.fixes.length > 0 && issue.fixes[0]) {
        Object.assign(config, issue.fixes[0].patch);
        appliedAny = true;
      }
    }
    if (!appliedAny) break;
    evaluation = evaluateMission(config, catalog);
  }

  rationaleSummary.push(
    `Synthesized ${preference.toUpperCase()} configuration for ${scenario.title}:`,
    `• Launch Ready: ${evaluation.launchReady ? "CERTIFIED" : "HOLD"}`,
    `• Total Wet Mass: ${evaluation.mass.totalWetMassKg.toFixed(0)} kg (Mass Margin: +${evaluation.mass.growthMarginPercent.toFixed(0)}%)`,
    `• Power Balance: +${evaluation.power.powerMarginPercent > 0 ? evaluation.power.powerMarginPercent.toFixed(0) : 0}% generation margin in orbit`,
    `• Total Mission Lifecycle Cost: $${evaluation.cost.totalMissionCostM.toFixed(1)}M (Budget Cap: $${scenario.budgetCapM}M)`
  );

  return {
    config,
    evaluation,
    explanations,
    rationaleSummary,
  };
}
