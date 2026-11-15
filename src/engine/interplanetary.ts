/**
 * MoonLander Interplanetary Astrodynamics & Ephemeris Engine
 *
 * Implements pure deterministic physics for interplanetary spaceflight:
 * - Keplerian Planetary Ephemeris (JPL Standish analytical approximation)
 * - Patched-Conic interplanetary transfers & departure/arrival hyperbolic excess (C3, v_infinity)
 * - Universal-Variable Lambert Solver (Stumpff functions & Newton-Raphson iteration)
 * - Porkchop Plot Matrix Generator for launch window optimization
 * - 1/r² Thermal Solar Flux & planetary equilibrium temperatures
 * - Interplanetary Light-Time Communications Delay & Deep Space Network (DSN) Link Budget scaling
 *
 * Pure TypeScript: Zero React, Three.js, or DOM dependencies. Sub-millisecond execution.
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface KeplerianElements {
  a: number; // Semi-major axis (AU for heliocentric, km for planetocentric)
  e: number; // Eccentricity (dimensionless)
  i: number; // Inclination (degrees)
  L: number; // Mean longitude (degrees)
  longPeri: number; // Longitude of perihelion (degrees)
  longNode: number; // Longitude of ascending node (degrees)
}

export interface EphemerisState {
  positionAU: Vector3D;
  velocityAUDay: Vector3D;
  distanceSunAU: number;
  solarFluxW_M2: number;
  equilibriumTempK: number;
}

export interface TransferWindowResult {
  departureDateDays: number;
  flightTimeDays: number;
  arrivalDateDays: number;
  c3DepartureKm2S2: number;
  vInfinityDepartureKmS: number;
  vInfinityArrivalKmS: number;
  deltaVDepartureMs: number;
  deltaVArrivalMs: number;
  totalDeltaVMs: number;
}

export interface PorkchopGrid {
  originBody: string;
  targetBody: string;
  depDaysRange: [number, number];
  tofDaysRange: [number, number];
  steps: number;
  depEpochs: number[];
  tofDays: number[];
  deltaVMatrix: number[][]; // grid of total Delta-V in m/s
  minDeltaV: number;
  optimalDepartureDay: number;
  optimalFlightTimeDays: number;
}

// Astronomical Constants
export const AU_TO_KM = 149597870.7; // 1 Astronomical Unit in km
export const SPEED_OF_LIGHT_KM_S = 299792.458;
export const GM_SUN_KM3_S2 = 1.32712440018e11;
export const GM_SUN_AU3_DAY2 = 0.0002959122082855911; // Gaussian gravitational constant k^2
export const SOLAR_CONSTANT_EARTH = 1361.0; // W/m^2 at 1 AU
export const STEFAN_BOLTZMANN = 5.670374419e-8; // W/(m^2 K^4)

export interface PlanetaryBodyData {
  id: string;
  name: string;
  parentBody: "sun" | "earth" | "jupiter";
  gmKm3S2: number;
  radiusKm: number;
  albedo: number;
  atmospherePressureBar: number; // Surface pressure: >0 allows aerobraking
  scaleHeightKm: number;
  elementsJ2000: KeplerianElements;
  elementsRatesCent: KeplerianElements; // Rates per Julian century
}

/**
 * JPL Standish Keplerian elements and rates for major bodies (valid 1800 - 2050 AD)
 * Reference: Standish, E.M., "Keplerian Elements for Approximate Positions of the Major Planets", NASA JPL (1992).
 */
export const PLANETARY_BODIES: Record<string, PlanetaryBodyData> = {
  mercury: {
    id: "mercury",
    name: "Mercury",
    parentBody: "sun",
    gmKm3S2: 22032.0,
    radiusKm: 2439.7,
    albedo: 0.106,
    atmospherePressureBar: 0,
    scaleHeightKm: 0,
    elementsJ2000: { a: 0.38709927, e: 0.20563593, i: 7.00497902, L: 252.2503235, longPeri: 77.45779628, longNode: 48.33076593 },
    elementsRatesCent: { a: 0.00000037, e: 0.00001906, i: -0.00594749, L: 149472.67411175, longPeri: 0.16047689, longNode: -0.12534081 },
  },
  venus: {
    id: "venus",
    name: "Venus",
    parentBody: "sun",
    gmKm3S2: 324859.0,
    radiusKm: 6051.8,
    albedo: 0.77,
    atmospherePressureBar: 92.0,
    scaleHeightKm: 15.9,
    elementsJ2000: { a: 0.72333566, e: 0.00677672, i: 3.39467605, L: 181.9790995, longPeri: 131.60246718, longNode: 76.67984255 },
    elementsRatesCent: { a: 0.0000039, e: -0.00004107, i: -0.0007889, L: 58517.81538729, longPeri: 0.00268329, longNode: -0.27769418 },
  },
  earth: {
    id: "earth",
    name: "Earth",
    parentBody: "sun",
    gmKm3S2: 398600.4418,
    radiusKm: 6378.137,
    albedo: 0.306,
    atmospherePressureBar: 1.013,
    scaleHeightKm: 8.5,
    elementsJ2000: { a: 1.00000261, e: 0.01671123, i: -0.00001531, L: 100.46457166, longPeri: 102.93768193, longNode: 0.0 },
    elementsRatesCent: { a: 0.00000562, e: -0.00004392, i: -0.01294668, L: 35999.37244981, longPeri: 0.32327364, longNode: 0.0 },
  },
  mars: {
    id: "mars",
    name: "Mars",
    parentBody: "sun",
    gmKm3S2: 42828.3752,
    radiusKm: 3389.5,
    albedo: 0.25,
    atmospherePressureBar: 0.00636,
    scaleHeightKm: 11.1,
    elementsJ2000: { a: 1.52371034, e: 0.0933941, i: 1.84969142, L: -4.55343205, longPeri: -23.94362959, longNode: 49.55953891 },
    elementsRatesCent: { a: 0.00001847, e: 0.00007882, i: -0.00813131, L: 19140.30268499, longPeri: 0.44441088, longNode: -0.29257343 },
  },
  jupiter: {
    id: "jupiter",
    name: "Jupiter",
    parentBody: "sun",
    gmKm3S2: 126686534.0,
    radiusKm: 69911.0,
    albedo: 0.538,
    atmospherePressureBar: 2.0,
    scaleHeightKm: 27.0,
    elementsJ2000: { a: 5.202887, e: 0.04838624, i: 1.30439695, L: 34.39644051, longPeri: 14.72847983, longNode: 100.47390909 },
    elementsRatesCent: { a: -0.00011607, e: -0.00013257, i: -0.00183714, L: 3034.74612775, longPeri: 0.21252668, longNode: 0.20469106 },
  },
  moon: {
    id: "moon",
    name: "Moon (Luna)",
    parentBody: "earth",
    gmKm3S2: 4902.800066,
    radiusKm: 1737.4,
    albedo: 0.12,
    atmospherePressureBar: 0,
    scaleHeightKm: 0,
    elementsJ2000: { a: 384400 / AU_TO_KM, e: 0.0549, i: 5.145, L: 218.316, longPeri: 83.353, longNode: 125.08 },
    elementsRatesCent: { a: 0, e: 0, i: 0, L: 477198.867, longPeri: 4069.013, longNode: -1934.136 },
  },
  europa: {
    id: "europa",
    name: "Europa",
    parentBody: "jupiter",
    gmKm3S2: 3202.73,
    radiusKm: 1560.8,
    albedo: 0.67,
    atmospherePressureBar: 0,
    scaleHeightKm: 0,
    elementsJ2000: { a: 671100 / AU_TO_KM, e: 0.009, i: 0.47, L: 0.0, longPeri: 0.0, longNode: 0.0 },
    elementsRatesCent: { a: 0, e: 0, i: 0, L: 36525 * (360 / 3.551181), longPeri: 0, longNode: 0 },
  },
};

/**
 * Computes Julian centuries since J2000.0 from an offset in days.
 */
export function daysToJulianCenturies(daysFromJ2000: number): number {
  return daysFromJ2000 / 36525.0;
}

/**
 * Solves Kepler's Equation M = E - e*sin(E) for Eccentric Anomaly E (in radians).
 */
export function solveKeplerEquation(M_rad: number, e: number): number {
  // Normalize M to [0, 2pi)
  let M = M_rad % (2 * Math.PI);
  if (M < 0) M += 2 * Math.PI;

  let E = e < 0.8 ? M : Math.PI;
  for (let iter = 0; iter < 15; iter++) {
    const f = E - e * Math.sin(E) - M;
    const fPrime = 1 - e * Math.cos(E);
    const delta = f / fPrime;
    E -= delta;
    if (Math.abs(delta) < 1e-10) break;
  }
  return E;
}

/**
 * Computes 3D heliocentric position and velocity of a body at given days from J2000.
 */
export function getBodyEphemeris(bodyId: string, daysFromJ2000: number): EphemerisState {
  const body = PLANETARY_BODIES[bodyId] ?? PLANETARY_BODIES.earth!;
  const T = daysToJulianCenturies(daysFromJ2000);

  // Compute instantaneous Keplerian elements
  const j2000 = body.elementsJ2000;
  const rates = body.elementsRatesCent;

  const a = j2000.a + rates.a * T;
  const e = j2000.e + rates.e * T;
  const i_deg = j2000.i + rates.i * T;
  const L_deg = j2000.L + rates.L * T;
  const longPeri_deg = j2000.longPeri + rates.longPeri * T;
  const longNode_deg = j2000.longNode + rates.longNode * T;

  const i_rad = (i_deg * Math.PI) / 180;
  const omega_bar_rad = (longPeri_deg * Math.PI) / 180;
  const Omega_rad = (longNode_deg * Math.PI) / 180;
  const omega_rad = omega_bar_rad - Omega_rad; // Argument of perihelion

  // Mean anomaly M = L - longPeri
  const M_deg = L_deg - longPeri_deg;
  const M_rad = (M_deg * Math.PI) / 180;

  // Solve for Eccentric Anomaly E
  const E_rad = solveKeplerEquation(M_rad, e);

  // Position in orbital plane
  const x_prime = a * (Math.cos(E_rad) - e);
  const y_prime = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E_rad);
  const r_AU = Math.sqrt(x_prime * x_prime + y_prime * y_prime);

  // Velocity in orbital plane (AU/day)
  const n_rad_day = Math.sqrt(GM_SUN_AU3_DAY2 / Math.pow(a, 3));
  const vx_prime = (-a * n_rad_day * Math.sin(E_rad)) / (1 - e * Math.cos(E_rad));
  const vy_prime = (a * n_rad_day * Math.sqrt(Math.max(0, 1 - e * e)) * Math.cos(E_rad)) / (1 - e * Math.cos(E_rad));

  // Transform orbital plane to 3D ecliptic frame
  const cosO = Math.cos(Omega_rad);
  const sinO = Math.sin(Omega_rad);
  const cosw = Math.cos(omega_rad);
  const sinw = Math.sin(omega_rad);
  const cosi = Math.cos(i_rad);
  const sini = Math.sin(i_rad);

  const Px = cosO * cosw - sinO * sinw * cosi;
  const Py = sinO * cosw + cosO * sinw * cosi;
  const Pz = sinw * sini;

  const Qx = -cosO * sinw - sinO * cosw * cosi;
  const Qy = -sinO * sinw + cosO * cosw * cosi;
  const Qz = cosw * sini;

  const x = x_prime * Px + y_prime * Qx;
  const y = x_prime * Py + y_prime * Qy;
  const z = x_prime * Pz + y_prime * Qz;

  const vx = vx_prime * Px + vy_prime * Qx;
  const vy = vx_prime * Py + vy_prime * Qy;
  const vz = vx_prime * Pz + vy_prime * Qz;

  // Thermal scaling at distance r
  const solarFlux = SOLAR_CONSTANT_EARTH / Math.pow(Math.max(0.1, r_AU), 2);
  const emissivity = 0.9;
  const equilibriumTempK = Math.round(
    Math.pow(((1 - body.albedo) * solarFlux) / (4 * emissivity * STEFAN_BOLTZMANN), 0.25)
  );

  return {
    positionAU: { x, y, z },
    velocityAUDay: { x: vx, y: vy, z: vz },
    distanceSunAU: r_AU,
    solarFluxW_M2: Math.round(solarFlux * 10) / 10,
    equilibriumTempK,
  };
}

/**
 * Stumpff functions c2(z) and c3(z) for the universal variable Lambert formulation.
 */
function stumpffC2(z: number): number {
  if (z > 0) {
    const s = Math.sqrt(z);
    return (1 - Math.cos(s)) / z;
  }
  if (z < 0) {
    const s = Math.sqrt(-z);
    return (Math.cosh(s) - 1) / -z;
  }
  return 0.5;
}

function stumpffC3(z: number): number {
  if (z > 0) {
    const s = Math.sqrt(z);
    return (s - Math.sin(s)) / (s * z);
  }
  if (z < 0) {
    const s = Math.sqrt(-z);
    return (Math.sinh(s) - s) / (-z * Math.sqrt(-z));
  }
  return 1.0 / 6.0;
}

/**
 * Universal Variable Lambert Solver.
 * Computes the Keplerian orbit connecting r1 to r2 over flight time dtSeconds.
 * Returns departure velocity v1 and arrival velocity v2 in km/s.
 */
export function solveLambert(
  r1_km: Vector3D,
  r2_km: Vector3D,
  dtSeconds: number,
  mu: number = GM_SUN_KM3_S2,
  prograde: boolean = true
): { v1: Vector3D; v2: Vector3D; converged: boolean } {
  const r1 = Math.sqrt(r1_km.x * r1_km.x + r1_km.y * r1_km.y + r1_km.z * r1_km.z);
  const r2 = Math.sqrt(r2_km.x * r2_km.x + r2_km.y * r2_km.y + r2_km.z * r2_km.z);

  const crossZ = r1_km.x * r2_km.y - r1_km.y * r2_km.x;
  const dot = (r1_km.x * r2_km.x + r1_km.y * r2_km.y + r1_km.z * r2_km.z) / (r1 * r2);
  const cosDnu = Math.max(-1, Math.min(1, dot));

  let dnu = Math.acos(cosDnu);
  if (prograde && crossZ < 0) {
    dnu = 2 * Math.PI - dnu;
  } else if (!prograde && crossZ >= 0) {
    dnu = 2 * Math.PI - dnu;
  }

  const A = Math.sin(dnu) * Math.sqrt((r1 * r2) / (1 - cosDnu));
  if (Math.abs(A) < 1e-8) {
    return { v1: { x: 0, y: 0, z: 0 }, v2: { x: 0, y: 0, z: 0 }, converged: false };
  }

  // Universal variable function to compute time-of-flight t(z)
  const computeT = (zVal: number): { t: number; y: number } => {
    const c2 = stumpffC2(zVal);
    const c3 = stumpffC3(zVal);
    const denom = Math.sqrt(Math.max(1e-12, c2));
    const yVal = r1 + r2 + (A * (zVal * c3 - 1)) / denom;
    if (yVal <= 0) return { t: -1, y: yVal };
    const chi = Math.sqrt(yVal / Math.max(1e-12, c2));
    const tVal = (Math.pow(chi, 3) * c3 + A * Math.sqrt(yVal)) / Math.sqrt(mu);
    return { t: tVal, y: yVal };
  };

  // Initial estimate for universal variable z
  let z = 0.0;
  let converged = false;

  for (let iter = 0; iter < 50; iter++) {
    const { t, y } = computeT(z);

    if (y <= 0) {
      z = z * 0.5;
      continue;
    }

    const dt = t - dtSeconds;

    if (Math.abs(dt) < 60.0 || Math.abs(dt / dtSeconds) < 1e-3) {
      converged = true;
      break;
    }

    // High-precision central finite difference for dt/dz
    const eps = 1e-5;
    const tPlus = computeT(z + eps).t;
    const tMinus = computeT(z - eps).t;
    const tPrime = (tPlus - tMinus) / (2 * eps);

    if (Math.abs(tPrime) < 1e-12) break;

    const deltaZ = dt / tPrime;
    // Damped Newton step
    z = z - Math.max(-2.5, Math.min(2.5, deltaZ));
  }

  const c2 = stumpffC2(z);
  const c3 = stumpffC3(z);
  const y = Math.max(1e-5, r1 + r2 + (A * (z * c3 - 1)) / Math.sqrt(Math.max(1e-12, c2)));

  // Lagrange f and g coefficients
  const f = 1 - y / r1;
  const g = A * Math.sqrt(y / mu);
  const gDot = 1 - y / r2;

  const v1: Vector3D = {
    x: (r2_km.x - f * r1_km.x) / g,
    y: (r2_km.y - f * r1_km.y) / g,
    z: (r2_km.z - f * r1_km.z) / g,
  };

  const v2: Vector3D = {
    x: (gDot * r2_km.x - r1_km.x) / g,
    y: (gDot * r2_km.y - r1_km.y) / g,
    z: (gDot * r2_km.z - r1_km.z) / g,
  };

  return { v1, v2, converged };
}

/**
 * Computes Synodic Period between two orbiting bodies in Earth days.
 */
export function computeSynodicPeriodDays(body1Id: string, body2Id: string): number {
  const b1 = PLANETARY_BODIES[body1Id] ?? PLANETARY_BODIES.earth!;
  const b2 = PLANETARY_BODIES[body2Id] ?? PLANETARY_BODIES.mars!;

  const T1 = Math.pow(b1.elementsJ2000.a, 1.5) * 365.256;
  const T2 = Math.pow(b2.elementsJ2000.a, 1.5) * 365.256;

  const synodic = 1.0 / Math.abs(1.0 / T1 - 1.0 / T2);
  return Math.round(synodic * 10) / 10;
}

/**
 * Computes Patched-Conic Departure and Arrival Delta-V for given departure and flight time.
 */
export function evaluateTransferWindow(
  originBodyId: string,
  targetBodyId: string,
  departureDay: number,
  flightTimeDays: number,
  parkingOrbitAltKm: number = 200,
  targetOrbitAltKm: number = 400
): TransferWindowResult {
  const origin = PLANETARY_BODIES[originBodyId] ?? PLANETARY_BODIES.earth!;
  const target = PLANETARY_BODIES[targetBodyId] ?? PLANETARY_BODIES.mars!;

  const arrivalDay = departureDay + flightTimeDays;
  const stateDep = getBodyEphemeris(originBodyId, departureDay);
  const stateArr = getBodyEphemeris(targetBodyId, arrivalDay);

  // Positions and velocities in km and km/s
  const r1_km: Vector3D = {
    x: stateDep.positionAU.x * AU_TO_KM,
    y: stateDep.positionAU.y * AU_TO_KM,
    z: stateDep.positionAU.z * AU_TO_KM,
  };
  const r2_km: Vector3D = {
    x: stateArr.positionAU.x * AU_TO_KM,
    y: stateArr.positionAU.y * AU_TO_KM,
    z: stateArr.positionAU.z * AU_TO_KM,
  };

  const vOrigin_km_s: Vector3D = {
    x: (stateDep.velocityAUDay.x * AU_TO_KM) / 86400,
    y: (stateDep.velocityAUDay.y * AU_TO_KM) / 86400,
    z: (stateDep.velocityAUDay.z * AU_TO_KM) / 86400,
  };
  const vTarget_km_s: Vector3D = {
    x: (stateArr.velocityAUDay.x * AU_TO_KM) / 86400,
    y: (stateArr.velocityAUDay.y * AU_TO_KM) / 86400,
    z: (stateArr.velocityAUDay.z * AU_TO_KM) / 86400,
  };

  const dtSeconds = flightTimeDays * 86400;
  const lambert = solveLambert(r1_km, r2_km, dtSeconds, GM_SUN_KM3_S2, true);

  // Hyperbolic excess velocity at departure (v_inf = v_sc - v_planet)
  const vInfDepVec: Vector3D = {
    x: lambert.v1.x - vOrigin_km_s.x,
    y: lambert.v1.y - vOrigin_km_s.y,
    z: lambert.v1.z - vOrigin_km_s.z,
  };
  const vInfDep = Math.sqrt(vInfDepVec.x ** 2 + vInfDepVec.y ** 2 + vInfDepVec.z ** 2);
  const c3 = vInfDep * vInfDep;

  // Hyperbolic excess velocity at arrival
  const vInfArrVec: Vector3D = {
    x: lambert.v2.x - vTarget_km_s.x,
    y: lambert.v2.y - vTarget_km_s.y,
    z: lambert.v2.z - vTarget_km_s.z,
  };
  const vInfArr = Math.sqrt(vInfArrVec.x ** 2 + vInfArrVec.y ** 2 + vInfArrVec.z ** 2);

  // Delta-V from low circular parking orbit to hyperbolic escape
  const rPark = origin.radiusKm + parkingOrbitAltKm;
  const vParkCirc = Math.sqrt(origin.gmKm3S2 / rPark);
  const vParkHyp = Math.sqrt(2 * (origin.gmKm3S2 / rPark) + vInfDep ** 2);
  const deltaVDepMs = Math.round((vParkHyp - vParkCirc) * 1000);

  // Delta-V for insertion into target circular orbit (propulsive capture)
  const rTarget = target.radiusKm + targetOrbitAltKm;
  const vTargetCirc = Math.sqrt(target.gmKm3S2 / rTarget);
  const vTargetHyp = Math.sqrt(2 * (target.gmKm3S2 / rTarget) + vInfArr ** 2);
  const deltaVArrMs = Math.round((vTargetHyp - vTargetCirc) * 1000);

  return {
    departureDateDays: departureDay,
    flightTimeDays,
    arrivalDateDays: arrivalDay,
    c3DepartureKm2S2: Math.round(c3 * 100) / 100,
    vInfinityDepartureKmS: Math.round(vInfDep * 1000) / 1000,
    vInfinityArrivalKmS: Math.round(vInfArr * 1000) / 1000,
    deltaVDepartureMs: deltaVDepMs,
    deltaVArrivalMs: deltaVArrMs,
    totalDeltaVMs: deltaVDepMs + deltaVArrMs,
  };
}

/**
 * Porkchop Plot Grid Generator.
 * Computes a 2D matrix of (departureDay, flightTimeDays) -> totalDeltaVMs.
 */
export function generatePorkchopPlot(
  originBodyId: string,
  targetBodyId: string,
  depStartDays: number,
  depSpanDays: number,
  tofMinDays: number,
  tofMaxDays: number,
  steps: number = 20
): PorkchopGrid {
  const depStep = depSpanDays / steps;
  const tofStep = (tofMaxDays - tofMinDays) / steps;

  const depEpochs: number[] = [];
  const tofDays: number[] = [];
  const deltaVMatrix: number[][] = [];

  let minDeltaV = Infinity;
  let optDep = depStartDays;
  let optTof = (tofMinDays + tofMaxDays) / 2;

  for (let j = 0; j <= steps; j++) {
    tofDays.push(Math.round(tofMinDays + j * tofStep));
  }

  for (let i = 0; i <= steps; i++) {
    const curDep = depStartDays + i * depStep;
    depEpochs.push(Math.round(curDep));
    const row: number[] = [];

    for (let j = 0; j <= steps; j++) {
      const curTof = tofMinDays + j * tofStep;
      try {
        const transfer = evaluateTransferWindow(originBodyId, targetBodyId, curDep, curTof);
        const totalDv = transfer.totalDeltaVMs;
        row.push(totalDv);
        if (totalDv < minDeltaV && totalDv > 1000) {
          minDeltaV = totalDv;
          optDep = curDep;
          optTof = curTof;
        }
      } catch {
        row.push(99999);
      }
    }
    deltaVMatrix.push(row);
  }

  return {
    originBody: originBodyId,
    targetBody: targetBodyId,
    depDaysRange: [depStartDays, depStartDays + depSpanDays],
    tofDaysRange: [tofMinDays, tofMaxDays],
    steps,
    depEpochs,
    tofDays,
    deltaVMatrix,
    minDeltaV: Math.round(minDeltaV),
    optimalDepartureDay: Math.round(optDep),
    optimalFlightTimeDays: Math.round(optTof),
  };
}

/**
 * Calculates one-way light-time communications delay in seconds and minutes.
 */
export function computeLightTimeDelay(distanceKm: number): { seconds: number; minutes: number } {
  const seconds = distanceKm / SPEED_OF_LIGHT_KM_S;
  return {
    seconds: Math.round(seconds * 10) / 10,
    minutes: Math.round((seconds / 60) * 10) / 10,
  };
}

/**
 * Calculates deep-space RF link margin and Free-Space Path Loss (FSPL) in dB.
 */
export function computeDeepSpaceLinkBudget(
  distanceKm: number,
  frequencyGhz: number,
  txPowerWatts: number,
  txDishDiameterM: number,
  rxDishDiameterM: number = 34 // 34-meter NASA Deep Space Network beam waveguide antenna
): { fsplDb: number; rxPowerDbm: number; linkMarginDb: number } {
  // Free-Space Path Loss: FSPL = 20 log10(d) + 20 log10(f) + 92.45 (for d in km, f in GHz)
  const fsplDb = 20 * Math.log10(Math.max(1, distanceKm)) + 20 * Math.log10(frequencyGhz) + 92.45;

  // Approximate parabolic dish gain: G = 10 log10(eta * (pi * D / lambda)^2)
  const lambdaM = 0.3 / frequencyGhz;
  const eta = 0.6; // 60% aperture efficiency
  const txGainDbi = 10 * Math.log10(eta * Math.pow((Math.PI * txDishDiameterM) / lambdaM, 2));
  const rxGainDbi = 10 * Math.log10(eta * Math.pow((Math.PI * rxDishDiameterM) / lambdaM, 2));

  const txPowerDbm = 10 * Math.log10(txPowerWatts * 1000);
  const rxPowerDbm = txPowerDbm + txGainDbi + rxGainDbi - fsplDb;

  // Threshold for 10 kbps deep-space telemetry typically around -145 dBm
  const sensitivityThresholdDbm = -142.0;
  const linkMarginDb = rxPowerDbm - sensitivityThresholdDbm;

  return {
    fsplDb: Math.round(fsplDb * 10) / 10,
    rxPowerDbm: Math.round(rxPowerDbm * 10) / 10,
    linkMarginDb: Math.round(linkMarginDb * 10) / 10,
  };
}
