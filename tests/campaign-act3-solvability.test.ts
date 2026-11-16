import { describe, it, expect } from "vitest";
import {
  scenarios,
  buses,
  propulsions,
  solarArrays,
  batteries,
  launchers,
  getCatalogLookup,
} from "@/data";
import { evaluateMission, type MissionDesignConfig } from "@/engine/evaluate";
import { createDefaultDesign } from "@/store/mission";

describe("Stage 3 Phase B: Scenario Solvability & Catalog Search Tests", () => {
  const catalog = getCatalogLookup();

  it("contains all 13 canonical scenarios including Act III deep-space worlds", () => {
    expect(scenarios.length).toBe(13);
    const expectedIds = [
      "earth-watch",
      "exoplanet-hunter",
      "space-weather-sentinel",
      "deep-space-telescope",
      "geo-telecom-relay",
      "lunar-pathfinder",
      "lunar-south-pole",
      "red-planet-relay",
      "mars-landing",
      "venus-probe",
      "europa-clipper",
      "titan-explorer",
      "asteroid-sample-return",
    ];
    for (const id of expectedIds) {
      expect(scenarios.some((s) => s.id === id)).toBe(true);
    }
  });

  it("proves scenarios are not trivially winnable with an empty/unconfigured bus", () => {
    const act3Scenarios = scenarios.filter((s) =>
      ["mars-landing", "venus-probe", "europa-clipper", "titan-explorer", "asteroid-sample-return"].includes(
        s.id
      )
    );

    for (const sc of act3Scenarios) {
      const trivialConfig: MissionDesignConfig = {
        id: `trivial-${sc.id}`,
        name: `Trivial Test ${sc.title}`,
        seed: `TEST-${sc.id}`,
        scenarioId: sc.id,
        difficulty: "INTERMEDIATE",
        isSandbox: false,
        busId: "bus-cubesat-12u", // Minimal bus cannot satisfy deep space alone
        propulsionId: "prop-cold-gas", // Inadequate Isp for deep space
        propellantMassKg: 5,
        solarArrayId: "solar-silicon",
        solarArrayAreaM2: 0.5,
        batteryId: "battery-li-ion-std",
        batteryCapacityWh: 100,
        adcsId: "adcs-magnetorquers",
        flightComputerId: "fc-cots",
        thermalId: "thermal-passive",
        commsId: "comms-s-band",
        groundNetworkId: "net-dedicated-single",
        storageGb: 64,
        selectedInstrumentIds: [],
        orbitId: sc.recommendedOrbitId,
        launcherId: "electron",
      };

      const evalResult = evaluateMission(trivialConfig, catalog);
      // Must not pass validation cleanly with empty instruments & inadequate subsystems
      expect(evalResult.validation.some((v) => v.severity === "error")).toBe(true);
      expect(evalResult.launchReady).toBe(false);
    }
  });

  it("verifies every scenario is winnable by at least 3 distinct subsystem configurations", () => {
    for (const sc of scenarios) {
      const baseline = createDefaultDesign(sc.id, "INTERMEDIATE", false);
      const winningConfigs: string[] = [];

      // Test baseline first
      const baseEval = evaluateMission(baseline, catalog);
      const baseErrors = baseEval.validation.filter((v) => v.severity === "error");
      if (baseErrors.length === 0 && baseEval.launchReady) {
        winningConfigs.push(`${baseline.busId}+${baseline.propulsionId}+${baseline.solarArrayId}+${baseline.launcherId}`);
      }

      // Perturb bus, propulsion, solar array, and launcher
      const candidateLaunchers = ["falcon-heavy", "sls-block-1", "ariane-64", "falcon-9", "vulcan-vc6"];
      const candidateBuses = ["bus-flagship", "bus-lander", "bus-midsize", "bus-smallsat"];
      const candidateProps = ["prop-biprop", "prop-descent-throttleable", "prop-mars-retro", "prop-hall-electric"];
      const candidateSolars = ["solar-gaas-triple", "solar-rtg-nuclear", "solar-silicon"];

      for (const busId of candidateBuses) {
        for (const propId of candidateProps) {
          for (const solarId of candidateSolars) {
            for (const launchId of candidateLaunchers) {
              const testConfig: MissionDesignConfig = {
                ...baseline,
                busId,
                propulsionId: propId,
                solarArrayId: solarId,
                solarArrayAreaM2: solarId === "solar-rtg-nuclear" ? 1.0 : Math.max(baseline.solarArrayAreaM2, 6.0),
                launcherId: launchId,
                batteryId: "battery-li-ion-adv",
                batteryCapacityWh: Math.max(baseline.batteryCapacityWh, 1500),
                propellantMassKg: Math.max(baseline.propellantMassKg, 250),
              };

              const evalRes = evaluateMission(testConfig, catalog);
              const errors = evalRes.validation.filter((v) => v.severity === "error");

              if (errors.length === 0 && evalRes.launchReady && evalRes.power.powerMarginW >= 0) {
                const key = `${busId}+${propId}+${solarId}+${launchId}`;
                if (!winningConfigs.includes(key)) {
                  winningConfigs.push(key);
                }
              }

              if (winningConfigs.length >= 3) break;
            }
            if (winningConfigs.length >= 3) break;
          }
          if (winningConfigs.length >= 3) break;
        }
        if (winningConfigs.length >= 3) break;
      }

      expect(
        winningConfigs.length,
        `Scenario "${sc.title}" (${sc.id}) must have >= 3 distinct valid solutions, found ${winningConfigs.length}`
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("verifies Titan Explorer mandates MMRTG nuclear power due to 9.58 AU solar attenuation", () => {
    const titanScenario = scenarios.find((s) => s.id === "titan-explorer");
    expect(titanScenario).toBeDefined();

    // Configuration with standard silicon solar panels at Titan
    const solarConfig: MissionDesignConfig = {
      id: "titan-solar",
      name: "Solar Titan Attempt",
      seed: "TITAN-SOLAR",
      scenarioId: "titan-explorer",
      difficulty: "INTERMEDIATE",
      isSandbox: false,
      busId: "bus-lander",
      propulsionId: "prop-descent-throttleable",
      propellantMassKg: 750,
      solarArrayId: "solar-silicon", // Fails at 9.58 AU
      solarArrayAreaM2: 5.0,
      batteryId: "battery-li-ion-adv",
      batteryCapacityWh: 2500,
      adcsId: "adcs-rcs-pulse",
      flightComputerId: "fc-rad-hard",
      thermalId: "thermal-heat-pipes",
      commsId: "comms-dsn-hga",
      groundNetworkId: "net-dsn-nsn",
      storageGb: 1024,
      selectedInstrumentIds: ["inst-surface-spectrometer", "inst-landing-lidar"],
      orbitId: "titan-atmosphere",
      launcherId: "falcon-heavy",
    };

    const solarRes = evaluateMission(solarConfig, catalog);
    // Solar generation at 9.58 AU should result in severe power deficit
    expect(solarRes.power.sunlitGenerationW).toBeLessThan(50);
    expect(solarRes.power.powerMarginW).toBeLessThan(0);

    // Swap to MMRTG nuclear power (dual unit)
    const rtgConfig: MissionDesignConfig = {
      ...solarConfig,
      solarArrayId: "solar-rtg-nuclear",
      solarArrayAreaM2: 2.0,
    };

    const rtgRes = evaluateMission(rtgConfig, catalog);
    // MMRTG generates steady decay heat power independent of solar distance
    expect(rtgRes.power.sunlitGenerationW).toBeGreaterThanOrEqual(110);
    expect(rtgRes.launchReady).toBe(true);
  });
});
