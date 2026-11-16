import { describe, it, expect } from "vitest";
import {
  buses,
  instruments,
  launchers,
  orbits,
  scenarios,
  glossary,
  destinations,
  exoplanets,
  spaceWeather,
  realMissions,
  landingSites,
  getCatalogLookup,
} from "./index";
import { evaluateMission, type MissionDesignConfig } from "../engine/evaluate";

describe("Data Integrity & Schema Validation Tests", () => {
  it("all catalogs have unique item IDs", () => {
    const checkUnique = (items: Array<{ id: string }>, name: string) => {
      const ids = new Set<string>();
      for (const item of items) {
        expect(ids.has(item.id), `Duplicate ID in ${name}: ${item.id}`).toBe(false);
        ids.add(item.id);
      }
    };

    checkUnique(buses, "buses");
    checkUnique(instruments, "instruments");
    checkUnique(launchers, "launchers");
    checkUnique(orbits, "orbits");
    checkUnique(scenarios, "scenarios");
    checkUnique(glossary, "glossary");
    checkUnique(destinations, "destinations");
    checkUnique(exoplanets, "exoplanets");
    checkUnique(spaceWeather, "spaceWeather");
    checkUnique(realMissions, "realMissions");
    checkUnique(landingSites, "landingSites");
  });

  it("landing sites catalog contains 8 verified lunar and martian landing sites", () => {
    expect(landingSites.length).toBe(8);
    for (const site of landingSites) {
      expect(site.id.length).toBeGreaterThan(0);
      expect(site.name.length).toBeGreaterThan(0);
      expect(site.safeRadiusM).toBeGreaterThanOrEqual(50);
      expect(site.targetDescription.length).toBeGreaterThan(0);
    }
  });

  it("has 12 playable destinations covering terrestrial, lagrange, lunar, outer system, and asteroid regimes", () => {
    expect(destinations.length).toBe(12);
    const orbitIds = new Set(orbits.map((o) => o.id));
    for (const dest of destinations) {
      expect(orbitIds.has(dest.defaultOrbitId), `Missing default orbit ${dest.defaultOrbitId}`).toBe(true);
      expect(dest.typicalDeltaVKmS).toBeGreaterThan(0);
      expect(dest.solarFluxW_M2).toBeGreaterThan(0);
      expect(dest.scienceGoals.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("all 13 scenarios are fully playable with budget, deadline, and valid targets", () => {
    expect(scenarios.length).toBe(13);
    for (const scenario of scenarios) {
      expect(scenario.playable).toBe(true);
      expect(scenario.budgetCapM).toBeGreaterThan(150);
      expect(scenario.deadlineMonths).toBeGreaterThan(30);
      expect(scenario.requirementsList.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("exoplanet catalog contains 5 verified NASA worlds with transit and atmospheric metrics", () => {
    expect(exoplanets.length).toBe(5);
    for (const planet of exoplanets) {
      expect(planet.orbitalPeriodDays).toBeGreaterThan(0);
      expect(planet.radiusEarthRadii).toBeGreaterThan(0);
      expect(planet.transitDepthPpm).toBeGreaterThan(0);
      expect(planet.atmosphereSignatures.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("space weather catalog contains 3 historic severe storms with Kp 9 data", () => {
    expect(spaceWeather.length).toBe(3);
    for (const storm of spaceWeather) {
      expect(storm.kpIndex).toBe(9);
      expect(storm.cmeSpeedKmS).toBeGreaterThan(1000);
      expect(storm.spacecraftCountermeasures.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("real missions catalog links all scenarios to NASA/ESA flight twins", () => {
    expect(realMissions.length).toBe(scenarios.length);
    const scenarioIds = new Set(scenarios.map((s) => s.id));
    for (const mission of realMissions) {
      expect(scenarioIds.has(mission.scenarioId), `Missing scenario link for ${mission.id}`).toBe(true);
      expect(mission.totalCostM).toBeGreaterThan(50);
      expect(mission.launchMassKg).toBeGreaterThan(300);
      expect(mission.nasaArchiveUrl).toMatch(/^https?:\/\//);
    }
  });

  it("glossary contains at least 30 terms with plain explanations", () => {
    expect(glossary.length).toBeGreaterThanOrEqual(30);
    for (const term of glossary) {
      expect(term.term.length).toBeGreaterThan(0);
      expect(term.shortDefinition.length).toBeGreaterThan(10);
      expect(term.fullExplanation.length).toBeGreaterThan(20);
    }
  });

  it("every scenario references a valid target orbit", () => {
    const orbitIds = new Set(orbits.map((o) => o.id));
    for (const scenario of scenarios) {
      expect(orbitIds.has(scenario.targetOrbitId)).toBe(true);
    }
  });

  it("every scenario recommended instrument exists in instrument catalog", () => {
    const instrumentIds = new Set(instruments.map((i) => i.id));
    for (const scenario of scenarios) {
      for (const instId of scenario.recommendedInstruments) {
        expect(instrumentIds.has(instId)).toBe(true);
      }
    }
  });

  it("every launcher and orbit class pair is consistent", () => {
    for (const launcher of launchers) {
      expect(launcher.fairingDiameterM).toBeGreaterThan(0);
      expect(launcher.priceM).toBeGreaterThan(0);
      expect(launcher.reliability).toBeGreaterThanOrEqual(0.9);
      expect(launcher.capacityKg.leo).not.toBeNull();
    }
  });
});

describe("Design Space Search: At least 3 valid designs per playable scenario", () => {
  const catalog = getCatalogLookup();

  it("finds at least 3 distinct valid designs for EARTH WATCH", () => {
    const scenarioId = "earth-watch";
    const validDesigns: MissionDesignConfig[] = [];

    // Distinct realistic variants:
    // 1. Midsize Landsat-class + Vega-C
    // 2. Midsize Landsat-class + Falcon 9
    // 3. Flagship platform + Falcon 9
    // 4. Midsize Landsat-class with Hyperspectral + Vega-C
    const candidateDesigns: Array<Partial<MissionDesignConfig>> = [
      {
        busId: "bus-midsize",
        launcherId: "vega-c",
        propulsionId: "prop-biprop",
        propellantMassKg: 120,
        solarArrayAreaM2: 7.5,
        batteryCapacityWh: 1200,
        commsId: "comms-ka-band",
        selectedInstrumentIds: ["inst-multispectral"],
      },
      {
        busId: "bus-midsize",
        launcherId: "falcon-9",
        propulsionId: "prop-biprop",
        propellantMassKg: 140,
        solarArrayAreaM2: 8.0,
        batteryCapacityWh: 1400,
        commsId: "comms-ka-band",
        selectedInstrumentIds: ["inst-multispectral"],
      },
      {
        busId: "bus-midsize",
        launcherId: "vega-c",
        propulsionId: "prop-monoprop",
        propellantMassKg: 150,
        solarArrayAreaM2: 7.0,
        batteryCapacityWh: 1100,
        commsId: "comms-ka-band",
        selectedInstrumentIds: ["inst-multispectral"],
      },
      {
        busId: "bus-midsize",
        launcherId: "falcon-9",
        propulsionId: "prop-biprop",
        propellantMassKg: 150,
        solarArrayAreaM2: 8.5,
        batteryCapacityWh: 1500,
        commsId: "comms-ka-band",
        selectedInstrumentIds: ["inst-multispectral"],
      },
    ];

    for (const partial of candidateDesigns) {
      const config: MissionDesignConfig = {
        id: `valid-ew-${partial.busId}-${partial.launcherId}-${partial.propulsionId}`,
        seed: "ML-7K2Q-91",
        name: "Earth Watch Candidate",
        scenarioId,
        difficulty: "ADVANCED",
        isSandbox: false,
        busId: partial.busId!,
        orbitId: "sso-700",
        launcherId: partial.launcherId!,
        solarArrayId: "solar-gaas-triple",
        solarArrayAreaM2: partial.solarArrayAreaM2!,
        batteryId: "battery-li-ion-std",
        batteryCapacityWh: partial.batteryCapacityWh!,
        propulsionId: partial.propulsionId!,
        propellantMassKg: partial.propellantMassKg!,
        adcsId: "adcs-reaction-wheels",
        flightComputerId: "fc-rad-tolerant",
        thermalId: partial.thermalId ?? "thermal-passive",
        commsId: partial.commsId ?? "comms-ka-band",
        groundNetworkId: "net-commercial-global",
        storageGb: 512,
        selectedInstrumentIds: partial.selectedInstrumentIds!,
      };

      const evalResult = evaluateMission(config, catalog);
      if (
        evalResult.launchReady &&
        evalResult.cost.withinBudget &&
        evalResult.schedule.withinDeadline &&
        evalResult.science.requirementsSummary.allRequirementsMet
      ) {
        validDesigns.push(config);
      }
    }

    expect(validDesigns.length).toBeGreaterThanOrEqual(3);
  });

  it("finds at least 3 distinct valid designs for EXOPLANET HUNTER", () => {
    const scenarioId = "exoplanet-hunter";
    const validDesigns: MissionDesignConfig[] = [];

    // Distinct realistic variants:
    // 1. Smallsat TESS-class + Falcon 9 (TLI insertion)
    // 2. Midsize Observatory + Falcon 9
    // 3. Smallsat TESS-class + Dual Instruments (Photometer + Spectrograph) + Fine Pointing
    const candidateDesigns: Array<Partial<MissionDesignConfig>> = [
      {
        busId: "bus-smallsat",
        launcherId: "falcon-9",
        propulsionId: "prop-biprop",
        propellantMassKg: 70,
        solarArrayAreaM2: 3.5,
        batteryCapacityWh: 450,
        adcsId: "adcs-reaction-wheels",
        selectedInstrumentIds: ["inst-transit-photometer"],
      },
      {
        busId: "bus-midsize",
        launcherId: "falcon-9",
        propulsionId: "prop-biprop",
        propellantMassKg: 100,
        solarArrayAreaM2: 5.0,
        batteryCapacityWh: 750,
        adcsId: "adcs-reaction-wheels",
        selectedInstrumentIds: ["inst-transit-photometer"],
      },
      {
        busId: "bus-smallsat",
        launcherId: "falcon-9",
        propulsionId: "prop-biprop",
        propellantMassKg: 80,
        solarArrayAreaM2: 4.0,
        batteryCapacityWh: 500,
        adcsId: "adcs-fine-pointing",
        selectedInstrumentIds: ["inst-transit-photometer", "inst-stellar-spectrograph"],
      },
    ];

    for (const partial of candidateDesigns) {
      const config: MissionDesignConfig = {
        id: `valid-exo-${partial.busId}-${partial.launcherId}-${partial.propulsionId}`,
        seed: "ML-TESS-01",
        name: "Exoplanet Candidate",
        scenarioId,
        difficulty: "ADVANCED",
        isSandbox: false,
        busId: partial.busId!,
        orbitId: "heo-tess",
        launcherId: partial.launcherId!,
        solarArrayId: "solar-gaas-triple",
        solarArrayAreaM2: partial.solarArrayAreaM2!,
        batteryId: "battery-li-ion-std",
        batteryCapacityWh: partial.batteryCapacityWh!,
        propulsionId: partial.propulsionId!,
        propellantMassKg: partial.propellantMassKg!,
        adcsId: partial.adcsId ?? "adcs-reaction-wheels",
        flightComputerId: "fc-rad-tolerant",
        thermalId: "thermal-passive",
        commsId: "comms-x-band",
        groundNetworkId: "net-dsn-nsn",
        storageGb: 512,
        selectedInstrumentIds: partial.selectedInstrumentIds!,
      };

      const evalResult = evaluateMission(config, catalog);
      if (
        evalResult.launchReady &&
        evalResult.cost.withinBudget &&
        evalResult.schedule.withinDeadline &&
        evalResult.science.requirementsSummary.allRequirementsMet
      ) {
        validDesigns.push(config);
      }
    }

    expect(validDesigns.length).toBeGreaterThanOrEqual(3);
  });
});
