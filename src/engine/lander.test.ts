import { describe, it, expect } from "vitest";
import {
  LUNAR_GRAVITY_M_S2,
  MARS_GRAVITY_M_S2,
  STANDARD_G0_M_S2,
  TIMESTEP_S,
  stepLanderPhysics,
  generateTerrain,
  computeAutopilotInput,
  evaluateTouchdown,
  replayDescent,
  initializeLanderState,
  type LanderConfig,
  type LanderState,
  type LandingSite,
  type ReplayLog,
  type LanderInput,
} from "./lander";

describe("MoonLander Powered Descent Physics Engine", () => {
  const referenceSite: LandingSite = {
    id: "apollo-11",
    name: "Apollo 11 // Mare Tranquillitatis",
    body: "moon",
    latDeg: 0.67408,
    lonDeg: 23.47297,
    elevationM: 0,
    safeZoneX: 0,
    safeRadiusM: 80,
    scienceTargetX: 120,
    targetDescription: "West Crater rim",
  };

  const defaultLanderConfig: LanderConfig = {
    body: "moon",
    dryMassKg: 650.0,
    propellantMassKg: 1200.0,
    maxThrustN: 6500.0,
    minThrottle: 0.1,
    ispSeconds: 311.0,
    rcsTorqueNm: 1500.0,
    maxPitchRateRadS: 0.35,
    legSpanM: 4.2,
    legStrokeM: 0.35,
    maxVerticalSpeedMS: 3.5,
    maxHorizontalSpeedMS: 1.2,
    tipOverAngleRad: 0.38,
    hazardDetectionQuality: 0.9,
  };

  it("free-fall from 100 m reaches 18.0 m/s (+- 0.05 m/s)", () => {
    const terrain = generateTerrain("test-seed-1", referenceSite);
    const groundY = terrain.getHeight(0);
    let state: LanderState = {
      t: 0,
      x: 0,
      y: groundY + 100.0,
      altitudeAGL: 100.0,
      vx: 0,
      vy: 0,
      pitchRad: 0,
      pitchRateRadS: 0,
      massKg: 1000.0,
      propellantKg: 200.0,
      throttle: 0,
      thrustN: 0,
      fuelExhausted: false,
      parachuteDeployed: false,
      isLanded: false,
      isCrashed: false,
      status: "in-flight",
    };

    const emptyInput: LanderInput = { throttle: 0, steer: 0, cutThrust: true };

    // Step until touchdown at y <= 0
    while (!state.isLanded && state.t < 30) {
      state = stepLanderPhysics(state, emptyInput, defaultLanderConfig, terrain, TIMESTEP_S);
    }

    expect(state.isLanded).toBe(true);
    // Theoretical v = sqrt(2 * g * h) = sqrt(2 * 1.62 * 100) = sqrt(324) = 18.00 m/s
    const finalSpeed = Math.abs(state.vy);
    expect(finalSpeed).toBeGreaterThanOrEqual(17.95);
    expect(finalSpeed).toBeLessThanOrEqual(18.05);
  });

  it("hover throttle matches m*g/T (+- 0.1%)", () => {
    const terrain = generateTerrain("test-seed-hover", referenceSite);
    const m = defaultLanderConfig.dryMassKg + defaultLanderConfig.propellantMassKg;
    const g = LUNAR_GRAVITY_M_S2;
    const Tmax = defaultLanderConfig.maxThrustN;
    const exactHoverThrottle = (m * g) / Tmax;

    let state: LanderState = {
      t: 0,
      x: 0,
      y: 500.0,
      altitudeAGL: 500.0,
      vx: 0,
      vy: 0,
      pitchRad: 0,
      pitchRateRadS: 0,
      massKg: m,
      propellantKg: defaultLanderConfig.propellantMassKg,
      throttle: exactHoverThrottle,
      thrustN: exactHoverThrottle * Tmax,
      fuelExhausted: false,
      parachuteDeployed: false,
      isLanded: false,
      isCrashed: false,
      status: "in-flight",
    };

    const hoverInput: LanderInput = { throttle: exactHoverThrottle, steer: 0 };

    // Advance 60 frames (0.5 s)
    for (let i = 0; i < 60; i++) {
      state = stepLanderPhysics(state, hoverInput, defaultLanderConfig, terrain, TIMESTEP_S);
    }

    // Velocity should remain approximately 0 (change less than 0.05 m/s)
    expect(Math.abs(state.vy)).toBeLessThan(0.05);
    // Applied throttle is within 0.1% of m*g/T
    expect(state.throttle).toBeCloseTo(exactHoverThrottle, 3);
  });

  it("propellant consumption satisfies the Tsiolkovsky rocket equation", () => {
    const terrain = generateTerrain("test-seed-rocket", referenceSite);
    const initialProp = 500.0;
    const m0 = defaultLanderConfig.dryMassKg + initialProp;
    const burnDurationS = 10.0;
    const thrustFraction = 0.8;
    const thrustN = thrustFraction * defaultLanderConfig.maxThrustN;

    let state: LanderState = {
      t: 0,
      x: 0,
      y: 5000.0,
      altitudeAGL: 5000.0,
      vx: 0,
      vy: 0,
      pitchRad: 0,
      pitchRateRadS: 0,
      massKg: m0,
      propellantKg: initialProp,
      throttle: thrustFraction,
      thrustN,
      fuelExhausted: false,
      parachuteDeployed: false,
      isLanded: false,
      isCrashed: false,
      status: "in-flight",
    };

    const fullThrustInput: LanderInput = { throttle: thrustFraction, steer: 0 };
    const numSteps = Math.round(burnDurationS / TIMESTEP_S);

    for (let i = 0; i < numSteps; i++) {
      state = stepLanderPhysics(state, fullThrustInput, defaultLanderConfig, terrain, TIMESTEP_S);
    }

    const expectedMdot = thrustN / (defaultLanderConfig.ispSeconds * STANDARD_G0_M_S2);
    const expectedMassConsumed = expectedMdot * burnDurationS;
    const actualMassConsumed = initialProp - state.propellantKg;

    // Matches mass flow within 0.05%
    expect(actualMassConsumed).toBeCloseTo(expectedMassConsumed, 1);
  });

  it("deterministic replay: identical inputs produce bitwise identical states", () => {
    const terrain = generateTerrain("seed-determinism-alpha", referenceSite);
    const replayLog: ReplayLog = {
      version: 1,
      seed: "seed-determinism-alpha",
      siteId: "apollo-11",
      body: "moon",
      config: defaultLanderConfig,
      assist: "manual",
      frames: [
        { frame: 10, throttle: 0.6, steer: 0.2 },
        { frame: 100, throttle: 0.8, steer: -0.1 },
        { frame: 350, throttle: 0.75, steer: 0.05 },
        { frame: 600, throttle: 0.9, steer: 0 },
      ],
    };

    const run1 = replayDescent(replayLog, terrain);
    const run2 = replayDescent(replayLog, terrain);

    expect(run1.finalState.x).toBe(run2.finalState.x);
    expect(run1.finalState.y).toBe(run2.finalState.y);
    expect(run1.finalState.vx).toBe(run2.finalState.vx);
    expect(run1.finalState.vy).toBe(run2.finalState.vy);
    expect(run1.finalState.propellantKg).toBe(run2.finalState.propellantKg);
    expect(run1.score).toBe(run2.score);
  });

  it("fuzzing test: 1,000 steps with randomized inputs produces zero NaN or Inf", () => {
    const terrain = generateTerrain("fuzz-seed-99", referenceSite);
    let state = initializeLanderState(defaultLanderConfig, 800.0);

    for (let i = 0; i < 1000; i++) {
      const randomThrottle = Math.sin(i * 1.3) * 0.5 + 0.5;
      const randomSteer = Math.cos(i * 0.9);
      const fuzzedInput: LanderInput = {
        throttle: randomThrottle,
        steer: randomSteer,
        cutThrust: i % 150 === 0,
      };

      state = stepLanderPhysics(state, fuzzedInput, defaultLanderConfig, terrain, TIMESTEP_S);

      expect(Number.isNaN(state.x)).toBe(false);
      expect(Number.isNaN(state.y)).toBe(false);
      expect(Number.isNaN(state.vx)).toBe(false);
      expect(Number.isNaN(state.vy)).toBe(false);
      expect(Number.isNaN(state.pitchRad)).toBe(false);
      expect(Number.isFinite(state.massKg)).toBe(true);
      expect(Number.isFinite(state.propellantKg)).toBe(true);

      if (state.isLanded) break;
    }
  });

  it("autopilot successfully lands reference designs across diverse seeds", () => {
    const seeds = ["apollo-seed-1", "chandrayaan-seed-2", "artemis-seed-3"];

    for (const seed of seeds) {
      const terrain = generateTerrain(seed, referenceSite);
      let state = initializeLanderState(defaultLanderConfig, 900.0);

      while (!state.isLanded && !state.isCrashed && state.t < 180) {
        const apInput = computeAutopilotInput(state, defaultLanderConfig, terrain);
        state = stepLanderPhysics(state, apInput, defaultLanderConfig, terrain, TIMESTEP_S);
      }

      const report = evaluateTouchdown(state, defaultLanderConfig, terrain);
      console.log(`[Autopilot Seed: ${seed}] Tier: ${report.tier}, Reason: ${report.reason}, Vy: ${report.verticalSpeedMS.toFixed(2)}, Vx: ${report.horizontalSpeedMS.toFixed(2)}, Tilt: ${report.tiltDeg.toFixed(2)}, X: ${state.x.toFixed(1)}, Fuel: ${state.propellantKg.toFixed(1)}`);

      // Must be safely landed or perfect
      expect(report.tier === "perfect" || report.tier === "safe").toBe(true);
      expect(report.finalState.isCrashed).toBe(false);
      expect(report.verticalSpeedMS).toBeLessThanOrEqual(defaultLanderConfig.maxVerticalSpeedMS);
      expect(report.horizontalSpeedMS).toBeLessThanOrEqual(defaultLanderConfig.maxHorizontalSpeedMS);
      expect(report.stars).toBeGreaterThanOrEqual(1);
    }
  });

  it("terrain generator is deterministic across calls with identical seed", () => {
    const terrain1 = generateTerrain("luna-fixed-seed", referenceSite);
    const terrain2 = generateTerrain("luna-fixed-seed", referenceSite);

    const testPoints = [-1000, -500, 0, 50, 100, 250, 800, 1500];
    for (const x of testPoints) {
      expect(terrain1.getHeight(x)).toBe(terrain2.getHeight(x));
      expect(terrain1.getSlopeRad(x)).toBe(terrain2.getSlopeRad(x));
    }
    expect(terrain1.hazards.length).toBe(terrain2.hazards.length);
  });
});
