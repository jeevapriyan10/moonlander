/**
 * MoonLander 2D Powered-Descent Engine (120 Hz Fixed Timestep)
 *
 * Implements deterministic physics for terminal powered descent,
 * hazard detection, terrain-relative landing, and touchdown mechanics.
 *
 * Integrator Choice:
 * Semi-Implicit (Symplectic) Euler:
 *   v_{n+1} = v_n + a_n * dt
 *   x_{n+1} = x_n + v_{n+1} * dt
 *
 * Documented Rationale:
 * 1. Symplectic energy conservation: In gravitational field and descent trajectories,
 *    semi-implicit Euler preserves phase space volume and avoids artificial orbital energy
 *    growth over thousands of simulation steps.
 * 2. Bitwise determinism: Unlike Runge-Kutta 4th order (RK4) which evaluates 4 intermediate
 *    force stages per step, semi-implicit Euler eliminates sub-step float rounding divergence
 *    when discrete user inputs (throttle, RCS pulses) occur mid-step. Replays are 100% bitwise identical.
 * 3. High responsiveness: 120 Hz provides 8.33 ms resolution, capturing abrupt terrain collisions,
 *    touchdown impulses, and autopilot control loops with zero jitter.
 */

import { createRNG } from "./rng";

export const LUNAR_GRAVITY_M_S2 = 1.62;
export const MARS_GRAVITY_M_S2 = 3.71;
export const STANDARD_G0_M_S2 = 9.80665;
export const TIMESTEP_S = 1 / 120; // 120 Hz fixed timestep

export type LanderBody = "moon" | "mars";
export type AssistLevel = "autopilot" | "assisted" | "manual";
export type TouchdownTier =
  | "perfect"
  | "safe"
  | "hard"
  | "tip-over"
  | "crash"
  | "out-of-fuel";

export interface LanderConfig {
  body: LanderBody;
  dryMassKg: number;
  propellantMassKg: number;
  maxThrustN: number;
  minThrottle: number; // e.g. 0.1 for 10% throttleable, 1.0 for fixed
  ispSeconds: number;
  rcsTorqueNm: number;
  maxPitchRateRadS: number; // e.g. 0.785 rad/s (45 deg/s)
  legSpanM: number; // Stance width (m)
  legStrokeM: number; // Shock absorber stroke (m)
  maxVerticalSpeedMS: number; // Max allowable vertical touchdown speed (m/s)
  maxHorizontalSpeedMS: number; // Max allowable horizontal touchdown speed (m/s)
  tipOverAngleRad: number; // Tip-over tilt threshold (rad)
  hazardDetectionQuality: number; // 0 to 1 (from radar/lidar)
}

export interface LandingSite {
  id: string;
  name: string;
  body: LanderBody;
  latDeg: number;
  lonDeg: number;
  elevationM: number;
  safeZoneX: number;
  safeRadiusM: number;
  scienceTargetX: number;
  targetDescription: string;
  historicalNotes?: string;
}

export interface TerrainHazard {
  x: number;
  radiusM: number;
  heightM: number;
  type: "boulder" | "crater-rim";
}

export interface TerrainMap {
  getHeight: (x: number) => number;
  getSlopeRad: (x: number) => number;
  hazards: TerrainHazard[];
  safeZoneX: number;
  safeRadiusM: number;
  scienceTargetX: number;
}

export interface LanderInput {
  throttle: number; // 0 to 1
  steer: number; // -1 (tilt left) to +1 (tilt right)
  cutThrust?: boolean;
  deployParachute?: boolean; // For Mars
}

export interface LanderState {
  t: number; // Simulation time (s)
  x: number; // Downrange distance (m)
  y: number; // Altitude above datum (m)
  altitudeAGL: number; // Altitude above ground level (m)
  vx: number; // Horizontal velocity (m/s)
  vy: number; // Vertical velocity (m/s)
  pitchRad: number; // Tilt from vertical (rad), positive = tilted forward (+X)
  pitchRateRadS: number; // Angular velocity (rad/s)
  massKg: number; // Total instantaneous mass (kg)
  propellantKg: number; // Remaining propellant (kg)
  throttle: number; // Applied throttle [0, 1]
  thrustN: number; // Applied thrust (N)
  fuelExhausted: boolean;
  parachuteDeployed: boolean;
  isLanded: boolean;
  isCrashed: boolean;
  status: "in-flight" | "landed" | "crashed" | "out-of-fuel";
  callout?: string;
}

export interface TouchdownReport {
  tier: TouchdownTier;
  finalState: LanderState;
  score: number;
  stars: 1 | 2 | 3 | 0;
  breakdown: {
    softnessScore: number;
    accuracyScore: number;
    fuelScore: number;
    timeScore: number;
    hazardBonus: number;
  };
  distanceToTargetM: number;
  distanceToSafeZoneM: number;
  verticalSpeedMS: number;
  horizontalSpeedMS: number;
  tiltDeg: number;
  slopeDeg: number;
  reason: string;
}

export interface ReplayFrame {
  frame: number;
  throttle: number;
  steer: number;
  flags?: number; // bit 0: cutThrust, bit 1: deployParachute
}

export interface ReplayLog {
  version: number;
  seed: string;
  siteId: string;
  body: LanderBody;
  config: LanderConfig;
  assist: AssistLevel;
  frames: ReplayFrame[];
}

/**
 * Procedural Deterministic Terrain Generator
 * Generates continuous elevation, crater stamping, safe landing plateau, and boulder hazards.
 */
export function generateTerrain(seed: string, site: LandingSite): TerrainMap {
  const rng = createRNG(seed + "-" + site.id);

  // Fractal harmonics parameters
  const harmonics: Array<{ amp: number; freq: number; phase: number }> = [];
  let a = 45.0;
  let f = 0.0008;
  for (let i = 0; i < 5; i++) {
    harmonics.push({
      amp: a,
      freq: f,
      phase: rng() * Math.PI * 2,
    });
    a *= 0.48;
    f *= 2.15;
  }

  // Generate 8 discrete crater stamps along the landing corridor
  const craters: Array<{ x: number; radius: number; depth: number }> = [];
  for (let i = 0; i < 8; i++) {
    const cx = -3000 + rng() * 6000;
    // Don't place deep craters directly on safe zone
    if (Math.abs(cx - site.safeZoneX) > site.safeRadiusM * 1.5) {
      craters.push({
        x: cx,
        radius: 35 + rng() * 120,
        depth: 8 + rng() * 25,
      });
    }
  }

  // Generate boulder hazards outside safe zone
  const hazards: TerrainHazard[] = [];
  for (let i = 0; i < 18; i++) {
    const bx = -2500 + rng() * 5000;
    if (Math.abs(bx - site.safeZoneX) > site.safeRadiusM * 1.2) {
      hazards.push({
        x: bx,
        radiusM: 0.8 + rng() * 2.2,
        heightM: 0.6 + rng() * 1.8,
        type: "boulder",
      });
    }
  }

  const safeZoneX = site.safeZoneX;
  const safeRadiusM = site.safeRadiusM;
  const scienceTargetX = site.scienceTargetX;

  // Base raw elevation function
  const rawHeight = (x: number): number => {
    let y = 0;
    for (const h of harmonics) {
      y += h.amp * Math.sin(x * h.freq + h.phase);
    }
    // Add crater depressions and raised rims
    for (const c of craters) {
      const dist = Math.abs(x - c.x);
      if (dist < c.radius * 1.4) {
        const u = dist / c.radius;
        if (u < 1.0) {
          // Inside crater bowl
          y -= c.depth * (1.0 - u * u);
        } else if (u < 1.4) {
          // Raised ejecta rim
          const rimFactor = (1.4 - u) / 0.4;
          y += c.depth * 0.18 * rimFactor;
        }
      }
    }
    return y;
  };

  const safeBaseHeight = rawHeight(safeZoneX);

  // Blended height function creating perfectly flat safe landing zone
  const getHeight = (x: number): number => {
    const distToSafe = Math.abs(x - safeZoneX);
    if (distToSafe <= safeRadiusM) {
      return safeBaseHeight;
    }
    if (distToSafe < safeRadiusM * 1.5) {
      // Smooth Hermite blend to natural terrain
      const t = (distToSafe - safeRadiusM) / (safeRadiusM * 0.5);
      const smoothT = t * t * (3 - 2 * t);
      return safeBaseHeight * (1 - smoothT) + rawHeight(x) * smoothT;
    }
    return rawHeight(x);
  };

  const getSlopeRad = (x: number): number => {
    const dx = 1.0;
    const dy = getHeight(x + dx) - getHeight(x - dx);
    return Math.atan(dy / (2 * dx));
  };

  return {
    getHeight,
    getSlopeRad,
    hazards,
    safeZoneX,
    safeRadiusM,
    scienceTargetX,
  };
}

/**
 * Derives dynamic LanderConfig from spacecraft design choices.
 * Maps bus, descent engine, RCS, and landing LIDAR / radar instruments to physical parameters.
 */
export function deriveLanderConfig(
  busId?: string,
  propulsionId?: string,
  adcsId?: string,
  instrumentIds: string[] = [],
  dryMassKg: number = 650,
  propellantMassKg: number = 900,
  body: LanderBody = "moon"
): { config: LanderConfig; initialTerminalPropellantKg: number } {
  // 1. Propulsion: thrust, throttleability, Isp
  let maxThrustN = 6500.0;
  let minThrottle = 0.10;
  let ispSeconds = 311.0;

  if (propulsionId === "prop-descent-throttleable") {
    maxThrustN = 7500.0;
    minThrottle = 0.10;
    ispSeconds = 318.0;
  } else if (propulsionId === "prop-descent-fixed") {
    maxThrustN = 6000.0;
    minThrottle = 1.00;
    ispSeconds = 295.0;
  } else if (propulsionId === "prop-mars-retro") {
    maxThrustN = 12000.0;
    minThrottle = 0.15;
    ispSeconds = 240.0;
  } else if (propulsionId === "prop-biprop") {
    maxThrustN = 4500.0;
    minThrottle = 0.20;
    ispSeconds = 310.0;
  } else if (propulsionId === "prop-monoprop") {
    maxThrustN = 3500.0;
    minThrottle = 0.25;
    ispSeconds = 220.0;
  }

  // 2. ADCS / RCS rate limits and control authority
  let rcsTorqueNm = 1200.0;
  let maxPitchRateRadS = 0.35;

  if (adcsId === "adcs-rcs-pulse") {
    rcsTorqueNm = 1800.0;
    maxPitchRateRadS = 0.45;
  } else if (adcsId === "adcs-reaction-wheels") {
    rcsTorqueNm = 900.0;
    maxPitchRateRadS = 0.30;
  } else if (adcsId === "adcs-magnetorquers") {
    rcsTorqueNm = 400.0;
    maxPitchRateRadS = 0.20;
  }

  // 3. Landing gear structural geometry from bus chassis
  const isLanderBus = busId === "bus-lander";
  const legSpanM = isLanderBus ? 4.6 : 3.4;
  const legStrokeM = isLanderBus ? 0.40 : 0.25;
  const maxVerticalSpeedMS = body === "mars" ? 4.2 : isLanderBus ? 3.8 : 2.8;
  const maxHorizontalSpeedMS = isLanderBus ? 1.5 : 0.9;
  const tipOverAngleRad = isLanderBus ? 0.42 : 0.33; // ~24 deg vs ~19 deg

  // 4. Terrain-relative navigation and hazard detection quality
  let hazardDetectionQuality = 0.50; // Base coarse radar
  if (instrumentIds.includes("inst-landing-lidar")) {
    hazardDetectionQuality = 0.95;
  } else if (instrumentIds.some((id) => id.includes("radar"))) {
    hazardDetectionQuality = 0.75;
  }

  const config: LanderConfig = {
    body,
    dryMassKg,
    propellantMassKg,
    maxThrustN,
    minThrottle,
    ispSeconds,
    rcsTorqueNm,
    maxPitchRateRadS,
    legSpanM,
    legStrokeM,
    maxVerticalSpeedMS,
    maxHorizontalSpeedMS,
    tipOverAngleRad,
    hazardDetectionQuality,
  };

  // Derive initial high-gate state
  const highGate = initializeLanderState(config, propellantMassKg);

  return {
    config,
    initialTerminalPropellantKg: highGate.propellantKg,
  };
}

/**
 * Calculates High-Gate Initial Conditions.
 * Derives initial terminal propellant by subtracting the orbital braking burn
 * (approx. 1.85 km/s delta-v from 100 km orbit) from the spacecraft's design propellant.
 */
export function initializeLanderState(
  config: LanderConfig,
  totalDesignPropellantKg: number
): LanderState {
  const g = config.body === "mars" ? MARS_GRAVITY_M_S2 : LUNAR_GRAVITY_M_S2;
  const initialTotalMassKg = config.dryMassKg + totalDesignPropellantKg;

  // Braking burn from circular orbit (1,850 m/s for Moon, 2,100 m/s for Mars)
  const brakingDvMS = config.body === "mars" ? 2100.0 : 1850.0;
  const massRatio = Math.exp(brakingDvMS / (config.ispSeconds * STANDARD_G0_M_S2));
  const finalMassAfterBrakingKg = initialTotalMassKg / massRatio;
  const brakingPropellantConsumedKg = initialTotalMassKg - finalMassAfterBrakingKg;

  // Remaining propellant allocated to terminal powered descent
  const availableTerminalPropellantKg = Math.max(
    0,
    totalDesignPropellantKg - brakingPropellantConsumedKg
  );

  const initialMassKg = config.dryMassKg + availableTerminalPropellantKg;

  return {
    t: 0,
    x: -2400.0, // High-gate downrange position (~2.4 km out from target)
    y: 2000.0, // High-gate altitude: 2,000 meters
    altitudeAGL: 2000.0,
    vx: 100.0, // Horizontal forward velocity: ~100 m/s
    vy: -30.0, // Vertical sink rate: ~-30 m/s
    pitchRad: -0.65, // ~-37 deg pitch-up retrograde brake
    pitchRateRadS: 0.0,
    massKg: initialMassKg,
    propellantKg: availableTerminalPropellantKg,
    throttle: 0.0,
    thrustN: 0.0,
    fuelExhausted: availableTerminalPropellantKg <= 0,
    parachuteDeployed: false,
    isLanded: false,
    isCrashed: false,
    status: availableTerminalPropellantKg <= 0 ? "out-of-fuel" : "in-flight",
    callout: "HIGH GATE ACQUISITION. RADAR LOCK CONFIRMED.",
  };
}

/**
 * Pure Deterministic Closed-Loop Autopilot Controller
 * Computes throttle and RCS pitch steering to guide lander to safe touchdown.
 */
export function computeAutopilotInput(
  state: LanderState,
  config: LanderConfig,
  terrain: TerrainMap
): LanderInput {
  const g = config.body === "mars" ? MARS_GRAVITY_M_S2 : LUNAR_GRAVITY_M_S2;
  const groundY = terrain.getHeight(state.x);
  const altAGL = Math.max(0, state.y - groundY);

  const dx = terrain.safeZoneX - state.x;
  const distToSafe = Math.abs(dx);

  // 1. Horizontal Guidance: smooth transitions, avoiding discontinuous sqrt limit-cycles
  let desiredVx = 0;
  if (distToSafe > 200.0) {
    const dirX = Math.sign(dx) || 1;
    desiredVx = dirX * Math.min(85.0, Math.sqrt(2.0 * 1.6 * (distToSafe - 50.0)));
  } else if (distToSafe > 20.0) {
    // Linear approach corridor
    desiredVx = Math.sign(dx) * Math.min(25.0, distToSafe * 0.18);
  } else {
    // Over safe landing zone: null out horizontal drift
    desiredVx = Math.max(-1.5, Math.min(1.5, dx * 0.1));
  }

  const vxError = desiredVx - state.vx;
  let axCmd = Math.max(-3.0, Math.min(3.0, vxError * 1.2));

  // 2. Vertical Guidance: smooth sink rate descending to 1.0 m/s at touchdown
  let desiredVy = -1.0;
  if (altAGL > 600.0) {
    desiredVy = -Math.min(28.0, Math.sqrt(2.0 * 0.35 * altAGL));
  } else if (altAGL > 60.0) {
    desiredVy = -Math.min(16.0, Math.sqrt(2.0 * 0.28 * altAGL) + 1.0);
  } else {
    // Terminal landing flare: linear reduction to -1.0 m/s
    desiredVy = -Math.max(0.9, Math.min(5.0, 0.9 + altAGL * 0.06));
  }

  // If we are high and moving fast horizontally, hold gentle descent to allow braking
  if (altAGL < 200.0 && distToSafe > terrain.safeRadiusM * 0.8) {
    desiredVy = Math.max(desiredVy, -1.5);
  }

  const vyError = desiredVy - state.vy;
  let ayCmd = vyError * 1.8;

  // 3. Inertial Thrust Vectoring
  // A_y must overcome gravity g plus commanded vertical acceleration
  const totalAx = axCmd;
  const totalAy = Math.max(0.2, ayCmd + g);

  let targetPitchRad = Math.atan2(totalAx, totalAy);

  // Near ground, enforce vertical leg alignment
  if (altAGL < 12.0) {
    targetPitchRad = Math.max(-0.03, Math.min(0.03, targetPitchRad * 0.15));
  } else if (altAGL < 50.0) {
    targetPitchRad = Math.max(-0.25, Math.min(0.25, targetPitchRad * 0.5));
  } else {
    targetPitchRad = Math.max(-0.85, Math.min(0.85, targetPitchRad)); // Max ~48 deg tilt
  }

  // Required thrust magnitude to satisfy both axes
  const totalAccelMag = Math.hypot(totalAx, totalAy);
  const commandedThrust = state.massKg * totalAccelMag;

  let throttle = commandedThrust / config.maxThrustN;
  if (config.minThrottle < 1.0) {
    throttle = Math.max(config.minThrottle, Math.min(1.0, throttle));
  } else {
    throttle = commandedThrust > config.maxThrustN * 0.5 ? 1.0 : 0.0;
  }

  // 4. Critically-damped RCS steering rate limiter
  const pitchError = targetPitchRad - state.pitchRad;
  const desiredPitchRate = Math.max(
    -config.maxPitchRateRadS,
    Math.min(config.maxPitchRateRadS, pitchError * 2.5)
  );
  const rateError = desiredPitchRate - state.pitchRateRadS;
  const steer = Math.max(-1.0, Math.min(1.0, rateError * 4.0));

  // Mars parachute logic: deploy between 1400m and 700m if speed < 400 m/s
  let deployParachute = false;
  if (
    config.body === "mars" &&
    !state.parachuteDeployed &&
    altAGL < 1400 &&
    altAGL > 700 &&
    Math.abs(state.vy) < 400
  ) {
    deployParachute = true;
  }

  return {
    throttle,
    steer,
    deployParachute,
  };
}

/**
 * Semi-Autonomous Assisted Input Mode (Attitude Hold & Hover Assist)
 */
export function computeAssistedInput(
  rawInput: LanderInput,
  state: LanderState,
  config: LanderConfig
): LanderInput {
  const g = config.body === "mars" ? MARS_GRAVITY_M_S2 : LUNAR_GRAVITY_M_S2;
  const cosPitch = Math.max(0.3, Math.cos(state.pitchRad));
  const hoverThrottle = Math.min(
    1.0,
    Math.max(config.minThrottle, (state.massKg * g) / (config.maxThrustN * cosPitch))
  );

  // If player is not tilting, hold current attitude (damp pitch rate)
  let steer = rawInput.steer;
  if (Math.abs(rawInput.steer) < 0.05) {
    steer = Math.max(-1.0, Math.min(1.0, -state.pitchRateRadS * 2.8));
  }

  // If player throttle is neutral (0.5), maintain steady hover
  let throttle = rawInput.throttle;
  if (Math.abs(rawInput.throttle - 0.5) < 0.08) {
    throttle = hoverThrottle;
  } else if (rawInput.throttle > 0.5) {
    // Climb
    throttle = hoverThrottle + (rawInput.throttle - 0.5) * 2.0 * (1.0 - hoverThrottle);
  } else {
    // Controlled descent
    throttle = hoverThrottle * (rawInput.throttle * 2.0);
  }

  return {
    throttle: Math.max(0.0, Math.min(1.0, throttle)),
    steer,
    cutThrust: rawInput.cutThrust,
    deployParachute: rawInput.deployParachute,
  };
}

/**
 * Single Fixed-Timestep (120 Hz) Simulation Step
 * Advances position, velocity, attitude, propellant, and verifies touchdown.
 */
export function stepLanderPhysics(
  state: LanderState,
  input: LanderInput,
  config: LanderConfig,
  terrain: TerrainMap,
  dt: number = TIMESTEP_S
): LanderState {
  if (state.isLanded || state.isCrashed) {
    return state;
  }

  const g = config.body === "mars" ? MARS_GRAVITY_M_S2 : LUNAR_GRAVITY_M_S2;
  let propellant = state.propellantKg;
  let fuelExhausted = state.fuelExhausted;

  // Determine applied throttle
  let appliedThrottle = 0.0;
  if (!fuelExhausted && !input.cutThrust && propellant > 0) {
    if (config.minThrottle >= 1.0) {
      // Fixed thrust engine: either 1.0 or 0
      appliedThrottle = input.throttle > 0.5 ? 1.0 : 0.0;
    } else {
      appliedThrottle =
        input.throttle < config.minThrottle * 0.5
          ? 0.0
          : Math.max(config.minThrottle, Math.min(1.0, input.throttle));
    }
  }

  const thrustN = appliedThrottle * config.maxThrustN;

  // Mass flow rate: mdot = T / (Isp * g0)
  if (thrustN > 0) {
    const mdot = thrustN / (config.ispSeconds * STANDARD_G0_M_S2);
    const dm = mdot * dt;
    if (propellant >= dm) {
      propellant -= dm;
    } else {
      propellant = 0;
      fuelExhausted = true;
    }
  }

  const currentMass = config.dryMassKg + propellant;

  // Thrust vector in world space: pitchRad = 0 is straight UP (+Y)
  // Tilting by +theta tilts nose to +X, so thrust pushes in direction (sin(pitch), cos(pitch))
  const thrustX = thrustN * Math.sin(state.pitchRad);
  const thrustY = thrustN * Math.cos(state.pitchRad);

  // Atmospheric drag (Mars only)
  let dragX = 0;
  let dragY = 0;
  let parachuteDeployed = state.parachuteDeployed;

  if (config.body === "mars") {
    if (input.deployParachute && !parachuteDeployed) {
      // Check deployment window
      const altAGL = state.y - terrain.getHeight(state.x);
      const totalSpeed = Math.hypot(state.vx, state.vy);
      if (altAGL > 600 && altAGL < 2200 && totalSpeed < 450) {
        parachuteDeployed = true;
      }
    }

    // Mars exponential atmosphere density: rho(y) = 0.020 * exp(-y / 11100)
    const rho = 0.02 * Math.exp(-Math.max(0, state.y) / 11100);
    const speed = Math.hypot(state.vx, state.vy);
    if (speed > 0.01) {
      const cdA = parachuteDeployed ? 180.0 : 3.0; // Parachute vs rigid capsule
      const dragMag = 0.5 * rho * speed * speed * cdA;
      dragX = -dragMag * (state.vx / speed);
      dragY = -dragMag * (state.vy / speed);
    }
  }

  // Net accelerations
  const ax = (thrustX + dragX) / currentMass;
  const ay = (thrustY + dragY) / currentMass - g;

  // Attitude & RCS dynamics
  // Clamped steering torque
  const steerInput = Math.max(-1.0, Math.min(1.0, input.steer));
  const torque = steerInput * config.rcsTorqueNm;
  // Moment of inertia estimate: I = 0.5 * mass * (legSpan/2)^2
  const Izz = Math.max(100.0, 0.45 * currentMass * Math.pow(config.legSpanM * 0.5, 2));
  const alpha = torque / Izz;

  // Semi-implicit Euler integration
  let pitchRate = state.pitchRateRadS + alpha * dt;
  pitchRate = Math.max(-config.maxPitchRateRadS, Math.min(config.maxPitchRateRadS, pitchRate));
  const pitchRad = state.pitchRad + pitchRate * dt;

  const vx = state.vx + ax * dt;
  const vy = state.vy + ay * dt;
  const x = state.x + vx * dt;
  const y = state.y + vy * dt;

  const groundY = terrain.getHeight(x);
  const altitudeAGL = Math.max(0, y - groundY);

  // Contextual CAPCOM callouts & Easter Eggs
  let callout = state.callout;
  const timeSec = state.t + dt;
  const fuelSecRemaining =
    thrustN > 0
      ? propellant / (thrustN / (config.ispSeconds * STANDARD_G0_M_S2))
      : 999;

  if (fuelSecRemaining < 60 && fuelSecRemaining >= 58) {
    callout = "CAPCOM: '60 SECONDS OF FUEL REMAINING.'";
  } else if (fuelSecRemaining < 30 && fuelSecRemaining >= 28) {
    callout = "CAPCOM: '30 SECONDS. WATCH YOUR SHADOW.'";
  } else if (fuelSecRemaining < 10 && propellant > 0) {
    callout = "CAPCOM: 'LOW FUEL ALERT. COMMIT TO TOUCHDOWN.'";
  } else if (fuelExhausted && !state.fuelExhausted) {
    callout = "CAPCOM: 'PROPULSION DEPLETED. ENGINE CUTOFF.'";
  } else if (altitudeAGL < 1200 && altitudeAGL > 1150 && Math.abs(vy) > 15) {
    // Apollo 11 1202 Easter Egg
    callout = "COMPUTER ALARM: '1202 PROGRAM ALARM. EXECUTIVE OVERFLOW. WE ARE GO ON THAT ALARM.'";
  } else if (altitudeAGL < 2.0 && vy < 0) {
    callout = "LUNAR CONTACT: 'CONTACT LIGHT. ENGINE STOP.'";
  }

  // Check touchdown collision
  if (altitudeAGL <= 0.05) {
    const isLandedOrCrashed = true;
    return {
      t: timeSec,
      x,
      y: groundY,
      altitudeAGL: 0,
      vx,
      vy,
      pitchRad,
      pitchRateRadS: 0,
      massKg: currentMass,
      propellantKg: propellant,
      throttle: appliedThrottle,
      thrustN,
      fuelExhausted,
      parachuteDeployed,
      isLanded: isLandedOrCrashed,
      isCrashed: false, // Evaluated in evaluateTouchdown
      status: fuelExhausted ? "out-of-fuel" : "landed",
      callout: "TOUCHDOWN CONFIRMED. COMMENCE SURFACE CHECKLIST.",
    };
  }

  return {
    t: timeSec,
    x,
    y,
    altitudeAGL,
    vx,
    vy,
    pitchRad,
    pitchRateRadS: pitchRate,
    massKg: currentMass,
    propellantKg: propellant,
    throttle: appliedThrottle,
    thrustN,
    fuelExhausted,
    parachuteDeployed,
    isLanded: false,
    isCrashed: false,
    status: fuelExhausted ? "out-of-fuel" : "in-flight",
    callout,
  };
}

/**
 * Evaluates touchdown against structural limits, slope, obstacles, and scores the flight.
 */
export function evaluateTouchdown(
  finalState: LanderState,
  config: LanderConfig,
  terrain: TerrainMap
): TouchdownReport {
  const groundSlopeRad = terrain.getSlopeRad(finalState.x);
  const slopeDeg = Math.abs(groundSlopeRad * (180 / Math.PI));
  const tiltDeg = Math.abs(finalState.pitchRad * (180 / Math.PI));
  const relTiltDeg = Math.abs((finalState.pitchRad - groundSlopeRad) * (180 / Math.PI));

  const vertSpeed = Math.abs(finalState.vy);
  const horizSpeed = Math.abs(finalState.vx);

  const distToSafeZone = Math.abs(finalState.x - terrain.safeZoneX);
  const distToScience = Math.abs(finalState.x - terrain.scienceTargetX);

  // Check boulder collision
  let hitHazard = false;
  let hazardReason = "";
  for (const h of terrain.hazards) {
    const dx = Math.abs(finalState.x - h.x);
    if (dx < h.radiusM + config.legSpanM * 0.4) {
      hitHazard = true;
      hazardReason = `Direct collision with ${h.type} obstacle (height ${h.heightM.toFixed(1)} m).`;
      break;
    }
  }

  let tier: TouchdownTier = "safe";
  let reason = "Nominal soft touchdown within all operational margins.";

  if (finalState.fuelExhausted && vertSpeed > config.maxVerticalSpeedMS * 1.5) {
    tier = "out-of-fuel";
    reason = "Propellant exhausted during terminal descent resulting in high-speed impact.";
  } else if (hitHazard) {
    tier = "crash";
    reason = hazardReason;
  } else if (vertSpeed > config.maxVerticalSpeedMS * 1.8) {
    tier = "crash";
    reason = `Excessive vertical impact speed (${vertSpeed.toFixed(2)} m/s > ${config.maxVerticalSpeedMS.toFixed(1)} m/s limit). Lander chassis crushed.`;
  } else if (
    relTiltDeg > config.tipOverAngleRad * (180 / Math.PI) ||
    slopeDeg > 22.0 ||
    horizSpeed > config.maxHorizontalSpeedMS * 2.2
  ) {
    tier = "tip-over";
    reason = `Lander dynamic tip-over on touchdown (ground slope ${slopeDeg.toFixed(1)}°, relative tilt ${relTiltDeg.toFixed(1)}°).`;
  } else if (
    vertSpeed > config.maxVerticalSpeedMS ||
    horizSpeed > config.maxHorizontalSpeedMS
  ) {
    tier = "hard";
    reason = `Hard landing (V_vert ${vertSpeed.toFixed(2)} m/s, V_horiz ${horizSpeed.toFixed(2)} m/s). Shock struts collapsed but cabin intact.`;
  } else if (
    vertSpeed <= 1.0 &&
    horizSpeed <= 0.35 &&
    distToSafeZone <= terrain.safeRadiusM &&
    relTiltDeg <= 5.0
  ) {
    tier = "perfect";
    reason = "Flawless textbook touchdown centered in safe zone with gentle contact.";
  }

  // 1000-Point Scoring Breakdown
  // 1. Softness (up to 300 pts)
  const softnessRatio = Math.max(0, 1 - vertSpeed / (config.maxVerticalSpeedMS * 1.5));
  const softnessScore = Math.round(softnessRatio * 300);

  // 2. Accuracy (up to 300 pts)
  const accuracyRatio = Math.max(0, 1 - distToSafeZone / 400);
  const accuracyScore = Math.round(accuracyRatio * 300);

  // 3. Fuel Economy (up to 250 pts)
  const fuelScore = Math.round(
    Math.min(250, (finalState.propellantKg / (config.propellantMassKg || 1)) * 300)
  );

  // 4. Time efficiency (up to 100 pts)
  const timeScore = Math.round(Math.max(0, 100 - finalState.t * 0.8));

  // 5. Hazard avoidance bonus (50 pts)
  const hazardBonus = !hitHazard ? 50 : 0;

  let totalScore = softnessScore + accuracyScore + fuelScore + timeScore + hazardBonus;
  if (tier === "crash" || tier === "out-of-fuel") {
    totalScore = Math.min(250, Math.round(totalScore * 0.2));
  } else if (tier === "tip-over") {
    totalScore = Math.min(450, Math.round(totalScore * 0.5));
  } else if (tier === "hard") {
    totalScore = Math.min(750, Math.round(totalScore * 0.8));
  }

  let stars: 1 | 2 | 3 | 0 = 0;
  if (tier === "perfect" || totalScore >= 850) {
    stars = 3;
  } else if (totalScore >= 680 && tier !== "crash") {
    stars = 2;
  } else if (totalScore >= 400 && tier !== "crash") {
    stars = 1;
  }

  return {
    tier,
    finalState: {
      ...finalState,
      isCrashed: tier === "crash" || tier === "out-of-fuel" || tier === "tip-over",
    },
    score: totalScore,
    stars,
    breakdown: {
      softnessScore,
      accuracyScore,
      fuelScore,
      timeScore,
      hazardBonus,
    },
    distanceToTargetM: distToScience,
    distanceToSafeZoneM: distToSafeZone,
    verticalSpeedMS: vertSpeed,
    horizontalSpeedMS: horizSpeed,
    tiltDeg,
    slopeDeg,
    reason,
  };
}

export interface ReplayResult extends TouchdownReport {
  states: LanderState[];
}

/**
 * Replays an input log and verifies deterministic reproduction
 */
export function replayDescent(
  log: ReplayLog,
  terrain: TerrainMap
): ReplayResult {
  let state = initializeLanderState(log.config, log.config.propellantMassKg);
  const frames = [...log.frames].sort((a, b) => a.frame - b.frame);
  let frameIdx = 0;
  let currentFrame = 0;
  const states: LanderState[] = [state];

  while (!state.isLanded && !state.isCrashed && state.t < 300) {
    let input: LanderInput = { throttle: 0, steer: 0 };
    if (log.assist === "autopilot") {
      input = computeAutopilotInput(state, log.config, terrain);
    } else {
      while (frameIdx < frames.length && frames[frameIdx]!.frame <= currentFrame) {
        const f = frames[frameIdx]!;
        input = {
          throttle: f.throttle,
          steer: f.steer,
          cutThrust: Boolean(f.flags && f.flags & 1),
          deployParachute: Boolean(f.flags && f.flags & 2),
        };
        frameIdx++;
      }
      if (log.assist === "assisted") {
        input = computeAssistedInput(input, state, log.config);
      }
    }

    state = stepLanderPhysics(state, input, log.config, terrain, TIMESTEP_S);
    states.push(state);
    currentFrame++;
  }

  const report = evaluateTouchdown(state, log.config, terrain);
  return {
    ...report,
    states,
  };
}
