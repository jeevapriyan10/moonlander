import { describe, it, expect } from "vitest";
import {
  calculatePropellantMass,
  calculateDeltaVDelivered,
  computeSolarGeneration,
  calculateOrbitalPeriodSeconds,
  calculateSemiMajorAxis,
  evaluateMission,
  validateMissionDesign,
  type MissionDesignInputs,
  type MissionDesignConfig,
  type CatalogLookup,
} from "./index";

describe("Propulsion Engine - Golden Rocket Equation", () => {
  it("rocket equation dry 1000 kg, dv 1500 m/s, Isp 320 s -> 613 kg (+-1)", () => {
    const mProp = calculatePropellantMass(1000, 1500, 320);
    expect(mProp).toBeGreaterThanOrEqual(612);
    expect(mProp).toBeLessThanOrEqual(614);
  });

  it("calculates delivered delta-v inversely consistent with propellant mass", () => {
    const mDry = 1000;
    const dvTarget = 1500;
    const isp = 320;
    const mProp = calculatePropellantMass(mDry, dvTarget, isp);
    const dvDelivered = calculateDeltaVDelivered(mDry, mProp, isp);
    expect(dvDelivered).toBeCloseTo(dvTarget, 1);
  });
});

describe("Astrodynamics & Power Property Tests", () => {
  it("higher altitude never decreases orbital period", () => {
    const altitudes = [200, 400, 700, 1000, 2000, 10000, 35786];
    let prevPeriod = 0;
    for (const alt of altitudes) {
      const a = calculateSemiMajorAxis(alt);
      const T = calculateOrbitalPeriodSeconds(a);
      expect(T).toBeGreaterThan(prevPeriod);
      prevPeriod = T;
    }
  });

  it("more solar array area never reduces power generation", () => {
    const areas = [1.0, 2.5, 5.0, 10.0, 20.0];
    let prevPower = 0;
    for (const area of areas) {
      const gen = computeSolarGeneration(area, 0.28, 1361, 15, 0.02, 5, 0.35);
      expect(gen.orbitAverageGenerationW).toBeGreaterThan(prevPower);
      prevPower = gen.orbitAverageGenerationW;
    }
  });

  it("more propellant never reduces delivered delta-v", () => {
    const props = [10, 50, 100, 250, 500];
    let prevDv = 0;
    for (const p of props) {
      const dv = calculateDeltaVDelivered(800, p, 310);
      expect(dv).toBeGreaterThan(prevDv);
      prevDv = dv;
    }
  });
});

describe("Validation Rules & Machine-Applicable Fixes", () => {
  const baseInputs: MissionDesignInputs = {
    scenarioId: "earth-watch",
    isSandbox: false,
    busId: "bus-microsat",
    busMaxDryMassKg: 180,
    busDiameterM: 1.0,
    totalDryMassKg: 150,
    totalWetMassKg: 200,
    launcherId: "electron",
    launcherCapacityKg: 200,
    launcherFairingDiameterM: 1.2,
    orbitAveragePowerW: 300,
    totalLoadW: 200,
    arrayAreaM2: 2.0,
    batteryCapacityWhInstalled: 250,
    batteryCapacityWhRequired: 200,
    adcsPointingDeg: 0.01,
    requiredPointingDeg: 0.01,
    storageInstalledGb: 500,
    storageRequiredGb: 200,
    dataReturnFraction: 0.95,
    totalMissionCostM: 60,
    budgetCapM: 100,
    totalScheduleMonths: 36,
    deadlineMonths: 48,
    totalDoseKrad: 7.5,
    minTidToleranceKrad: 50,
    requiresCryo: false,
    hasCryocooler: false,
    instrumentCount: 1,
    recommendedArrayAreaM2: 3.5,
    recommendedBatteryWh: 400,
    upgradeLauncherId: "falcon-9",
    upgradeBusId: "bus-smallsat",
  };

  it("triggers mass-bus-exceeded when dry mass exceeds bus capacity and offers bus upgrade fix", () => {
    const inputs = {
      ...baseInputs,
      totalDryMassKg: 220, // exceeds 180 kg
    };
    const issues = validateMissionDesign(inputs);
    const busIssue = issues.find((i) => i.id === "mass-bus-exceeded");
    expect(busIssue).toBeDefined();
    expect(busIssue?.severity).toBe("error");
    expect(busIssue?.fixes.length).toBeGreaterThan(0);
    expect(busIssue?.fixes[0]?.patch).toHaveProperty("busId", "bus-smallsat");
  });

  it("triggers mass-launcher-exceeded and offers launcher upgrade fix", () => {
    const inputs = {
      ...baseInputs,
      totalWetMassKg: 350, // exceeds Electron 200 kg
    };
    const issues = validateMissionDesign(inputs);
    const launcherIssue = issues.find((i) => i.id === "mass-launcher-exceeded");
    expect(launcherIssue).toBeDefined();
    expect(launcherIssue?.severity).toBe("error");
    expect(launcherIssue?.fixes[0]?.patch).toHaveProperty("launcherId", "falcon-9");
  });

  it("triggers power-deficit-sunlit and offers solar array increase fix", () => {
    const inputs = {
      ...baseInputs,
      orbitAveragePowerW: 100,
      totalLoadW: 250,
    };
    const issues = validateMissionDesign(inputs);
    const powerIssue = issues.find((i) => i.id === "power-deficit-sunlit");
    expect(powerIssue).toBeDefined();
    expect(powerIssue?.severity).toBe("error");
    expect(powerIssue?.fixes[0]?.patch).toHaveProperty("solarArrayAreaM2", 3.5);
  });

  it("triggers cryo-cooler-missing when IR sensor lacks cryocooler and offers fix", () => {
    const inputs = {
      ...baseInputs,
      requiresCryo: true,
      hasCryocooler: false,
    };
    const issues = validateMissionDesign(inputs);
    const cryoIssue = issues.find((i) => i.id === "cryo-cooler-missing");
    expect(cryoIssue).toBeDefined();
    expect(cryoIssue?.severity).toBe("error");
    expect(cryoIssue?.fixes[0]?.patch).toHaveProperty("thermalId", "thermal-cryocooler");
  });
});
