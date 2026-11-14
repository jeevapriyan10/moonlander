import { describe, it, expect } from "vitest";
import {
  calculateSemiMajorAxis,
  calculateOrbitalPeriodSeconds,
  calculateOrbitsPerDay,
  calculateSunSyncInclinationDeg,
  calculateEclipseFraction,
  solveKepler,
  calculateRevisitDays,
} from "./orbit";

describe("Orbit Mechanics Engine - Golden Values", () => {
  it("LEO 400 km period = 92.57 min (+-0.1)", () => {
    const a = calculateSemiMajorAxis(400);
    const periodSec = calculateOrbitalPeriodSeconds(a);
    const periodMin = periodSec / 60;
    expect(periodMin).toBeGreaterThanOrEqual(92.47);
    expect(periodMin).toBeLessThanOrEqual(92.67);
  });

  it("GEO period = 23.934 h (+-0.01) at 35,786 km", () => {
    const a = calculateSemiMajorAxis(35786);
    const periodSec = calculateOrbitalPeriodSeconds(a);
    const periodHours = periodSec / 3600;
    expect(periodHours).toBeGreaterThanOrEqual(23.924);
    expect(periodHours).toBeLessThanOrEqual(23.944);
  });

  it("SSO inclination at 700 km = 98.2 deg (+-0.15) and at 600 km = 97.8 deg (+-0.15)", () => {
    const inc700 = calculateSunSyncInclinationDeg(700);
    expect(inc700).toBeGreaterThanOrEqual(98.05);
    expect(inc700).toBeLessThanOrEqual(98.35);

    const inc600 = calculateSunSyncInclinationDeg(600);
    expect(inc600).toBeGreaterThanOrEqual(97.65);
    expect(inc600).toBeLessThanOrEqual(97.95);
  });

  it("eclipse fraction 400 km beta=0 = 0.369 (+-0.005)", () => {
    const ef = calculateEclipseFraction(400, 0);
    expect(ef).toBeGreaterThanOrEqual(0.364);
    expect(ef).toBeLessThanOrEqual(0.374);
  });

  it("Kepler solver round-trip error < 1e-9", () => {
    const testCases = [
      { m: 0.1, e: 0.05 },
      { m: 1.2, e: 0.2 },
      { m: 2.8, e: 0.7 },
      { m: 5.5, e: 0.4 },
    ];

    for (const { m, e } of testCases) {
      const E = solveKepler(m, e);
      const computedM = E - e * Math.sin(E);
      const error = Math.abs(computedM - m);
      expect(error).toBeLessThan(1e-9);
    }
  });

  it("revisit for 705 km SSO with 185 km swath ~ 15-16 days", () => {
    const revisit = calculateRevisitDays(185, 705);
    expect(revisit).toBeGreaterThanOrEqual(14.5);
    expect(revisit).toBeLessThanOrEqual(16.5);
  });
});
