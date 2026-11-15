import { describe, it, expect } from "vitest";
import {
  getBodyEphemeris,
  computeSynodicPeriodDays,
  computeLightTimeDelay,
  computeDeepSpaceLinkBudget,
  evaluateTransferWindow,
  generatePorkchopPlot,
  solveLambert,
  PLANETARY_BODIES,
  AU_TO_KM,
} from "./interplanetary";

describe("Interplanetary Astrodynamics Engine", () => {
  it("calculates accurate planetary ephemeris for Earth and Mars", () => {
    const earth = getBodyEphemeris("earth", 0); // J2000 epoch
    expect(earth.distanceSunAU).toBeCloseTo(1.0, 1);
    expect(earth.solarFluxW_M2).toBeGreaterThan(1300);
    expect(earth.solarFluxW_M2).toBeLessThan(1430);

    const mars = getBodyEphemeris("mars", 0);
    expect(mars.distanceSunAU).toBeGreaterThan(1.38);
    expect(mars.distanceSunAU).toBeLessThan(1.67);
    // Solar flux at Mars ~590 W/m^2
    expect(mars.solarFluxW_M2).toBeGreaterThan(480);
    expect(mars.solarFluxW_M2).toBeLessThan(720);
  });

  it("calculates accurate solar flux drop for Jupiter and outer planets", () => {
    const jupiter = getBodyEphemeris("jupiter", 0);
    expect(jupiter.distanceSunAU).toBeGreaterThan(4.9);
    expect(jupiter.distanceSunAU).toBeLessThan(5.5);
    // Solar flux at Jupiter ~50 W/m^2
    expect(jupiter.solarFluxW_M2).toBeGreaterThan(45);
    expect(jupiter.solarFluxW_M2).toBeLessThan(60);
  });

  it("calculates Earth-Mars synodic period as approximately 780 days (26 months)", () => {
    const synodicDays = computeSynodicPeriodDays("earth", "mars");
    expect(synodicDays).toBeGreaterThan(770);
    expect(synodicDays).toBeLessThan(790);
  });

  it("calculates one-way light-time communications delays accurately", () => {
    // Moon distance ~384,400 km -> ~1.28 seconds
    const moonDelay = computeLightTimeDelay(384400);
    expect(moonDelay.seconds).toBeCloseTo(1.3, 1);

    // Mars average opposition ~78,000,000 km -> ~4.3 minutes
    const marsDelay = computeLightTimeDelay(78000000);
    expect(marsDelay.minutes).toBeGreaterThan(4.0);
    expect(marsDelay.minutes).toBeLessThan(5.0);

    // Mars solar conjunction ~378,000,000 km -> ~21 minutes
    const marsConjDelay = computeLightTimeDelay(378000000);
    expect(marsConjDelay.minutes).toBeGreaterThan(20.0);
    expect(marsConjDelay.minutes).toBeLessThan(23.0);
  });

  it("evaluates deep-space communications link budget with NASA DSN 34m antenna", () => {
    // Mars range: 100 million km, 8.4 GHz X-band, 50W transmitter, 2m spacecraft dish, 34m DSN receiver
    const link = computeDeepSpaceLinkBudget(100000000, 8.4, 50, 2.0, 34);
    expect(link.fsplDb).toBeGreaterThan(260); // Free space path loss > 260 dB
    expect(link.linkMarginDb).toBeGreaterThan(0); // Positive link margin
  });

  it("solves Lambert's problem for a realistic transfer orbit", () => {
    const r1 = { x: 1.0 * AU_TO_KM, y: 0, z: 0 };
    const r2 = { x: 0, y: 1.52 * AU_TO_KM, z: 0 };
    const tofSeconds = 200 * 86400; // 200 days

    const result = solveLambert(r1, r2, tofSeconds);
    expect(result.converged).toBe(true);
    expect(Math.abs(result.v1.y)).toBeGreaterThan(20); // ~30 km/s orbital speed
  });

  it("generates a valid porkchop plot matrix for Earth-to-Mars departures", () => {
    const grid = generatePorkchopPlot("earth", "mars", 0, 300, 150, 300, 10);
    expect(grid.deltaVMatrix.length).toBe(11);
    expect(grid.deltaVMatrix[0]!.length).toBe(11);
    expect(grid.minDeltaV).toBeGreaterThan(3000); // Earth departure + Mars capture >= 3.5 km/s
    expect(grid.minDeltaV).toBeLessThan(15000);
    expect(grid.optimalFlightTimeDays).toBeGreaterThanOrEqual(150);
  });
});
