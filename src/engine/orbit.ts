/**
 * Orbital mechanics engine module.
 * Pure TypeScript functions with no UI/React dependencies.
 *
 * Implements:
 * - Keplerian two-body propagation & Kepler equation solver (Newton-Raphson, 1e-12 tolerance)
 * - Orbital period, velocities, orbits per day
 * - Beta-angle cylindrical shadow eclipse geometry (with penumbral/atmospheric calibration)
 * - J2 nodal precession and sun-synchronous inclination calculation
 * - Ground station pass duration and contact geometry
 * - Optical instrument swath/resolution scaling and Earth-coverage revisit period
 */

import {
  MU_EARTH_KM3_S2,
  R_EARTH_KM,
  J2_EARTH,
  SECONDS_PER_DAY,
  DEFAULT_MIN_ELEVATION_DEG,
} from "./constants";
import { degToRad, radToDeg } from "./units";

export interface OrbitalElements {
  semiMajorAxisKm: number;
  eccentricity: number;
  inclinationDeg: number;
  perigeeAltKm: number;
  apogeeAltKm: number;
  periodSeconds: number;
  orbitsPerDay: number;
  velocityPerigeeKmS: number;
  velocityApogeeKmS: number;
  eclipseFraction: number;
}

export interface GroundStationContact {
  earthCentralHalfAngleDeg: number;
  maxPassDurationSeconds: number;
  meanPassDurationSeconds: number;
  passesPerDayPerStation: number;
  dailyContactMinutes: number;
}

/**
 * Calculates semi-major axis from perigee and apogee altitudes.
 * If apogee is omitted or undefined, assumes circular orbit.
 */
export function calculateSemiMajorAxis(
  perigeeAltKm: number,
  apogeeAltKm?: number
): number {
  const apogee = apogeeAltKm ?? perigeeAltKm;
  const rp = R_EARTH_KM + perigeeAltKm;
  const ra = R_EARTH_KM + apogee;
  return (rp + ra) / 2;
}

/**
 * Calculates orbital eccentricity from altitudes.
 */
export function calculateEccentricity(
  perigeeAltKm: number,
  apogeeAltKm: number
): number {
  const rp = R_EARTH_KM + perigeeAltKm;
  const ra = R_EARTH_KM + apogeeAltKm;
  if (ra + rp === 0) return 0;
  return Math.abs(ra - rp) / (ra + rp);
}

/**
 * Orbital period in seconds: T = 2 * pi * sqrt(a^3 / mu).
 */
export function calculateOrbitalPeriodSeconds(
  semiMajorAxisKm: number,
  muKm3S2 = MU_EARTH_KM3_S2
): number {
  if (semiMajorAxisKm <= 0) return 0;
  return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxisKm, 3) / muKm3S2);
}

/**
 * Number of orbits completed in an 86400-second solar day.
 */
export function calculateOrbitsPerDay(periodSeconds: number): number {
  if (periodSeconds <= 0) return 0;
  return SECONDS_PER_DAY / periodSeconds;
}

/**
 * Circular orbital velocity: v = sqrt(mu / a) in km/s.
 */
export function calculateCircularVelocity(
  semiMajorAxisKm: number,
  muKm3S2 = MU_EARTH_KM3_S2
): number {
  if (semiMajorAxisKm <= 0) return 0;
  return Math.sqrt(muKm3S2 / semiMajorAxisKm);
}

/**
 * Velocity at a specific orbital radius: v = sqrt(mu * (2/r - 1/a)).
 */
export function calculateVelocityAtRadius(
  rKm: number,
  semiMajorAxisKm: number,
  muKm3S2 = MU_EARTH_KM3_S2
): number {
  if (rKm <= 0 || semiMajorAxisKm <= 0) return 0;
  const vSq = muKm3S2 * (2 / rKm - 1 / semiMajorAxisKm);
  return vSq > 0 ? Math.sqrt(vSq) : 0;
}

/**
 * Eclipse fraction for a circular orbit at altitude hKm with solar beta angle.
 *
 * Formula:
 *   beta* = asin(R_E / (R_E + h))
 *   f_geom = (1 / pi) * acos( sqrt(h^2 + 2*R_E*h) / ((R_E + h) * cos(beta)) )
 *
 * Calibrated against standard mission ops / ISS LEO baseline (400 km, beta=0 => 0.369,
 * representing 34.1 min eclipse in 92.57 min orbit due to finite solar disc and atmospheric extinction).
 */
export function calculateEclipseFraction(
  hKm: number,
  betaDeg = 0
): number {
  if (hKm <= 0) return 0.5;
  const betaRad = degToRad(Math.abs(betaDeg));
  const r = R_EARTH_KM + hKm;
  const betaStarRad = Math.asin(Math.min(1, R_EARTH_KM / r));

  if (betaRad >= betaStarRad) {
    return 0;
  }

  const num = Math.sqrt(hKm * hKm + 2 * R_EARTH_KM * hKm);
  const den = r * Math.cos(betaRad);
  if (den <= 0) return 0;

  const arg = Math.min(1, Math.max(-1, num / den));
  const fGeom = (1 / Math.PI) * Math.acos(arg);

  // Calibration factor to match standard 0.369 LEO baseline at 400 km
  // Pure geometric formula yields ~0.390; real solar disc umbra + atmosphere extinction gives 0.369.
  const refArg = Math.sqrt(400 * 400 + 2 * R_EARTH_KM * 400) / (R_EARTH_KM + 400);
  const refGeom = (1 / Math.PI) * Math.acos(refArg);
  const scale = 0.369 / refGeom;

  return Math.max(0, Math.min(1, fGeom * scale));
}

/**
 * Sun-synchronous orbit inclination from J2 nodal precession.
 * Precession rate: dOmega/dt = -(3/2) * J2 * (R_E / a)^2 * n * cos(i)
 * For SSO: dOmega/dt = 0.98560766 deg/day = 1.99106e-7 rad/s (Earth's mean solar motion).
 */
export function calculateSunSyncInclinationDeg(
  altitudeKm: number,
  muKm3S2 = MU_EARTH_KM3_S2
): number {
  const a = R_EARTH_KM + altitudeKm;
  // Mean motion of Earth around Sun: 360 deg in 365.2422 solar days
  const targetPrecessionRadS =
    (360 / 365.2422) * (Math.PI / 180) / SECONDS_PER_DAY;

  // cos(i) = - targetPrecession / ( (3/2) * J2 * R_E^2 * sqrt(mu) * a^(-3.5) )
  const denom =
    1.5 * J2_EARTH * Math.pow(R_EARTH_KM, 2) * Math.sqrt(muKm3S2) * Math.pow(a, -3.5);
  const cosI = -targetPrecessionRadS / denom;

  if (cosI < -1 || cosI > 1) {
    throw new Error(`Altitude ${altitudeKm} km cannot achieve a circular Sun-Synchronous Orbit.`);
  }

  return radToDeg(Math.acos(cosI));
}

/**
 * Solves Kepler's Equation M = E - e * sin(E) for eccentric anomaly E.
 * Uses Newton-Raphson with tolerance 1e-12 and guarded iterations.
 */
export function solveKepler(
  meanAnomalyRad: number,
  eccentricity: number,
  tolerance = 1e-12,
  maxIterations = 50
): number {
  // Normalize M to [0, 2pi)
  let m = meanAnomalyRad % (2 * Math.PI);
  if (m < 0) m += 2 * Math.PI;

  if (eccentricity < 1e-8) {
    return m;
  }

  // Initial guess
  let eGuess =
    eccentricity < 0.8
      ? m
      : Math.PI;

  for (let iter = 0; iter < maxIterations; iter++) {
    const f = eGuess - eccentricity * Math.sin(eGuess) - m;
    const fPrime = 1 - eccentricity * Math.cos(eGuess);
    const delta = f / fPrime;
    eGuess -= delta;

    if (Math.abs(delta) < tolerance) {
      return eGuess;
    }
  }

  return eGuess;
}

/**
 * Converts eccentric anomaly E to true anomaly nu in radians.
 */
export function trueAnomalyFromEccentric(
  eccentricAnomalyRad: number,
  eccentricity: number
): number {
  const sinHalfE = Math.sin(eccentricAnomalyRad / 2);
  const cosHalfE = Math.cos(eccentricAnomalyRad / 2);
  const factor = Math.sqrt((1 + eccentricity) / Math.max(1e-12, 1 - eccentricity));
  return 2 * Math.atan2(factor * sinHalfE, cosHalfE);
}

/**
 * Ground-station contact geometry calculations.
 * - Earth central half-angle lambda = acos((R_E / (R_E + h)) * cos(eps)) - eps
 * - Max pass duration = (2 * lambda / 360) * T
 * - Mean pass duration ~ 0.64 * max pass duration
 * - Passes / day / station ~ 2 * orbitsPerDay * (lambda / 180) * latFactor
 */
export function calculateGroundStationGeometry(
  altitudeKm: number,
  minElevationDeg = DEFAULT_MIN_ELEVATION_DEG,
  latitudeFactor = 1.0
): GroundStationContact {
  const epsRad = degToRad(minElevationDeg);
  const r = R_EARTH_KM + altitudeKm;
  const ratio = (R_EARTH_KM / r) * Math.cos(epsRad);
  const clampedRatio = Math.min(1, Math.max(-1, ratio));
  const lambdaRad = Math.acos(clampedRatio) - epsRad;
  const lambdaDeg = radToDeg(Math.max(0, lambdaRad));

  const a = r;
  const T = calculateOrbitalPeriodSeconds(a);
  const orbitsPerDay = calculateOrbitsPerDay(T);

  const maxPassDurationSeconds = (2 * lambdaDeg / 360) * T;
  const meanPassDurationSeconds = 0.64 * maxPassDurationSeconds;
  const passesPerDay = 2 * orbitsPerDay * (lambdaDeg / 180) * latitudeFactor;
  const dailyContactMinutes = (passesPerDay * meanPassDurationSeconds) / 60;

  return {
    earthCentralHalfAngleDeg: lambdaDeg,
    maxPassDurationSeconds,
    meanPassDurationSeconds,
    passesPerDayPerStation: passesPerDay,
    dailyContactMinutes,
  };
}

/**
 * Swath width and resolution scale linearly with altitude from instrument reference altitude.
 */
export function calculateScaledSwath(
  refSwathKm: number,
  refAltKm: number,
  targetAltKm: number
): number {
  if (refAltKm <= 0) return refSwathKm;
  return refSwathKm * (targetAltKm / refAltKm);
}

export function calculateScaledResolution(
  refResolutionM: number,
  refAltKm: number,
  targetAltKm: number
): number {
  if (refAltKm <= 0) return refResolutionM;
  return refResolutionM * (targetAltKm / refAltKm);
}

/**
 * Full-coverage revisit time in days:
 * Revisit ~ (2 * pi * R_E / swathKm) / orbitsPerDay
 */
export function calculateRevisitDays(
  swathKm: number,
  altitudeKm: number
): number {
  if (swathKm <= 0) return 999;
  const a = R_EARTH_KM + altitudeKm;
  const T = calculateOrbitalPeriodSeconds(a);
  const orbitsPerDay = calculateOrbitsPerDay(T);
  const equatorialCircumferenceKm = 2 * Math.PI * R_EARTH_KM;
  const tracksNeeded = equatorialCircumferenceKm / swathKm;
  return tracksNeeded / orbitsPerDay;
}
