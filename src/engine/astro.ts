/**
 * Pure Astronomical Math & Ephemeris Engine.
 *
 * Implements IAU / NASA Goddard reference models:
 * - Julian Date & J2000 epoch reduction
 * - Greenwich Mean Sidereal Time (GMST)
 * - Low-precision analytical Solar Position in ECI (Astronomical Almanac)
 * - Earth-Centered Inertial (ECI) <-> Earth-Centered Earth-Fixed (ECEF) rotation
 * - Lat/Lon to 3D Cartesian coordinates with exact Three.js equirectangular texture UV alignment
 * - Ground stations and primary orbital launch sites
 * - Lunar ephemeris & illumination phase fraction
 *
 * Coordinate Convention (Three.js standard):
 * - +Y is North Pole
 * - Equatorial plane is X-Z
 * - +X is Prime Meridian (lon = 0) at equator
 * - -Z is 90 deg East, +Z is 90 deg West
 * - Positive rotation around Y is Eastward rotation of Earth
 *
 * Strict pure TypeScript: zero Three.js, React, or DOM dependencies.
 */

import { degToRad, radToDeg } from "./units";

export const J2000_EPOCH_JD = 2451545.0; // 2000-01-01 12:00:00 TT
export const EARTH_AXIAL_TILT_DEG = 23.4392911; // Standard Earth obliquity
export const EARTH_RADIUS_KM = 6378.137;

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface LatLon {
  latDeg: number;
  lonDeg: number;
}

export interface GroundSite {
  id: string;
  name: string;
  country: string;
  latDeg: number;
  lonDeg: number;
  type: "launch_site" | "ground_station";
}

/** Primary real-world launch sites and NASA/ESA/ISRO tracking stations */
export const GROUND_SITES: Record<string, GroundSite> = {
  sriharikota: {
    id: "sriharikota",
    name: "Satish Dhawan Space Centre (SHAR)",
    country: "India",
    latDeg: 13.72,
    lonDeg: 80.23,
    type: "launch_site",
  },
  kennedy: {
    id: "kennedy",
    name: "Kennedy Space Center (LC-39A)",
    country: "USA",
    latDeg: 28.57,
    lonDeg: -80.65,
    type: "launch_site",
  },
  kourou: {
    id: "kourou",
    name: "Guiana Space Centre (ELA-4)",
    country: "France / ESA",
    latDeg: 5.24,
    lonDeg: -52.77,
    type: "launch_site",
  },
  vandenberg: {
    id: "vandenberg",
    name: "Vandenberg Space Force Base (SLC-4E)",
    country: "USA",
    latDeg: 34.74,
    lonDeg: -120.57,
    type: "launch_site",
  },
  wallops: {
    id: "wallops",
    name: "Wallops Flight Facility (MARS)",
    country: "USA",
    latDeg: 37.94,
    lonDeg: -75.46,
    type: "launch_site",
  },
  baikonur: {
    id: "baikonur",
    name: "Baikonur Cosmodrome (Site 1/5)",
    country: "Kazakhstan",
    latDeg: 45.96,
    lonDeg: 63.3,
    type: "launch_site",
  },
  jiuquan: {
    id: "jiuquan",
    name: "Jiuquan Satellite Launch Center (SLS-1)",
    country: "China",
    latDeg: 40.96,
    lonDeg: 100.28,
    type: "launch_site",
  },
  goldstone: {
    id: "goldstone",
    name: "Goldstone Deep Space Comm Complex (DSN)",
    country: "USA",
    latDeg: 35.43,
    lonDeg: -116.89,
    type: "ground_station",
  },
  madrid: {
    id: "madrid",
    name: "Madrid Deep Space Comm Complex (DSN)",
    country: "Spain",
    latDeg: 40.43,
    lonDeg: -4.25,
    type: "ground_station",
  },
  canberra: {
    id: "canberra",
    name: "Canberra Deep Space Comm Complex (DSN)",
    country: "Australia",
    latDeg: -35.4,
    lonDeg: 148.98,
    type: "ground_station",
  },
  svalbard: {
    id: "svalbard",
    name: "Svalbard Satellite Station (SvalSat)",
    country: "Norway",
    latDeg: 78.23,
    lonDeg: 15.41,
    type: "ground_station",
  },
};

/**
 * Converts a standard UTC Date or Unix timestamp into Julian Date (JD).
 */
export function toJulianDate(dateOrTimestamp: Date | number): number {
  const ms = typeof dateOrTimestamp === "number" ? dateOrTimestamp : dateOrTimestamp.getTime();
  // Unix epoch (1970-01-01T00:00:00Z) is JD 2440587.5
  return ms / 86400000.0 + 2440587.5;
}

/**
 * Converts a Julian Date back to standard JavaScript Date (UTC).
 */
export function fromJulianDate(jd: number): Date {
  const ms = (jd - 2440587.5) * 86400000.0;
  return new Date(Math.round(ms));
}

/**
 * Normalizes an angle in degrees into [0, 360).
 */
export function normalizeDegrees(deg: number): number {
  const m = deg % 360;
  return m < 0 ? m + 360 : m;
}

/**
 * Computes Greenwich Mean Sidereal Time (GMST) in degrees [0, 360) for a given Julian Date.
 * Formula: IAU 1982 / Astronomical Almanac:
 * GMST = 280.46061837 + 360.98564736629 * (JD - 2451545.0) [deg]
 */
export function computeGMST(jd: number): number {
  const d = jd - J2000_EPOCH_JD;
  const gmst = 280.46061837 + 360.98564736629 * d;
  return normalizeDegrees(gmst);
}

/**
 * Computes the Sun's position vector in Earth-Centered Inertial (ECI) coordinates.
 * Returns a normalized unit vector pointing from Earth toward the Sun.
 *
 * Three.js coordinate convention:
 * - +Y is North celestial pole
 * - Equator is X-Z plane
 * - +X is Vernal Equinox (lambda = 0)
 *
 * Algorithm (US Naval Observatory / Astronomical Almanac low-precision model, ~0.01 deg):
 * n = JD - 2451545.0
 * L = 280.460 + 0.9856474 * n (Mean longitude)
 * g = 357.528 + 0.9856003 * n (Mean anomaly)
 * lambda = L + 1.915 * sin(g) + 0.020 * sin(2g) (Ecliptic longitude)
 * eps = 23.439 - 0.0000004 * n (Obliquity of ecliptic)
 */
export function computeSunDirectionECI(jd: number): Vector3D {
  const n = jd - J2000_EPOCH_JD;
  const L = degToRad(normalizeDegrees(280.46 + 0.9856474 * n));
  const g = degToRad(normalizeDegrees(357.528 + 0.9856003 * n));

  const lambdaDeg =
    radToDeg(L) +
    1.915 * Math.sin(g) +
    0.02 * Math.sin(2 * g);
  const lambda = degToRad(normalizeDegrees(lambdaDeg));

  const epsDeg = 23.439 - 0.0000004 * n;
  const eps = degToRad(epsDeg);

  // Ecliptic coordinates: xEcl = cos(lambda), yEcl = sin(lambda), zEcl = 0
  // Equatorial ECI coordinates with +Y = North:
  // x = cos(lambda)
  // y = sin(eps) * sin(lambda)  (North component)
  // z = -cos(eps) * sin(lambda) (Equator component aligned with Three.js sphere)
  const x = Math.cos(lambda);
  const y = Math.sin(eps) * Math.sin(lambda);
  const z = -Math.cos(eps) * Math.sin(lambda);

  const len = Math.hypot(x, y, z);
  return { x: x / len, y: y / len, z: z / len };
}

/**
 * Computes solar declination in degrees [-23.44, +23.44] for a given Julian Date.
 */
export function computeSolarDeclinationDeg(jd: number): number {
  const sunDir = computeSunDirectionECI(jd);
  return radToDeg(Math.asin(Math.max(-1, Math.min(1, sunDir.y))));
}

/**
 * Converts a vector from Earth-Centered Inertial (ECI) to Earth-Centered Earth-Fixed (ECEF)
 * rotating around the Y polar axis by the GMST angle.
 */
export function eciToEcef(vECI: Vector3D, gmstDeg: number): Vector3D {
  const theta = degToRad(gmstDeg);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  return {
    x: cosT * vECI.x - sinT * vECI.z,
    y: vECI.y,
    z: sinT * vECI.x + cosT * vECI.z,
  };
}

/**
 * Converts a vector from Earth-Centered Earth-Fixed (ECEF) to Earth-Centered Inertial (ECI)
 * rotating backwards around the Y polar axis by the GMST angle.
 */
export function ecefToEci(vECEF: Vector3D, gmstDeg: number): Vector3D {
  const theta = degToRad(gmstDeg);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  return {
    x: cosT * vECEF.x + sinT * vECEF.z,
    y: vECEF.y,
    z: -sinT * vECEF.x + cosT * vECEF.z,
  };
}

/**
 * Maps geographic latitude and longitude (degrees) to a 3D unit vector.
 *
 * Aligns precisely with Three.js SphereGeometry equirectangular UV mapping:
 * - Latitude: -90 deg (South Pole, -Y) to +90 deg (North Pole, +Y)
 * - Longitude: -180 deg to +180 deg
 * - Prime Meridian (lon = 0) is at u = 0.5 (texture center), pointing along +X.
 * - Eastern longitudes (e.g. India 80E) have z < 0.
 * - Western longitudes (e.g. USA -80W) have z > 0.
 *
 * Three.js SphereGeometry parameterization:
 *   x = radius * cos(lat) * cos(lon)
 *   y = radius * sin(lat)
 *   z = -radius * cos(lat) * sin(lon)
 */
export function latLonToVector3(latDeg: number, lonDeg: number, radius = 1.0): Vector3D {
  const latRad = degToRad(latDeg);
  const lonRad = degToRad(lonDeg);

  const cosLat = Math.cos(latRad);
  const sinLat = Math.sin(latRad);
  const cosLon = Math.cos(lonRad);
  const sinLon = Math.sin(lonRad);

  return {
    x: radius * cosLat * cosLon,
    y: radius * sinLat,
    z: -radius * cosLat * sinLon,
  };
}

/**
 * Inverts a 3D Cartesian position into geographic latitude and longitude (degrees).
 * Guarantees round-trip identity with latLonToVector3 to < 1e-9 tolerance.
 */
export function vector3ToLatLon(v: Vector3D, radius?: number): LatLon {
  const r = radius ?? Math.hypot(v.x, v.y, v.z);
  if (r === 0) return { latDeg: 0, lonDeg: 0 };

  const clampedY = Math.max(-1, Math.min(1, v.y / r));
  const latDeg = radToDeg(Math.asin(clampedY));

  // From x = r*cos(lat)*cos(lon) and z = -r*cos(lat)*sin(lon):
  // sin(lon) / cos(lon) = -z / x => lon = atan2(-z, x)
  let lonDeg = radToDeg(Math.atan2(-v.z, v.x));
  if (lonDeg > 180) lonDeg -= 360;
  if (lonDeg <= -180) lonDeg += 360;

  return { latDeg, lonDeg };
}

/**
 * Computes sub-solar point latitude and longitude on Earth for a given Julian Date.
 */
export function computeSubSolarLatLon(jd: number): LatLon {
  const sunDirECI = computeSunDirectionECI(jd);
  const gmst = computeGMST(jd);
  const sunDirECEF = eciToEcef(sunDirECI, gmst);
  return vector3ToLatLon(sunDirECEF);
}

/**
 * Low-precision Lunar ephemeris model (Meeus / Astronomical Algorithms ~0.5 deg).
 * Computes lunar position in ECI and illuminated phase fraction k in [0, 1].
 */
export function computeMoonState(jd: number): {
  positionECI: Vector3D;
  distanceKm: number;
  phaseFraction: number; // 0 = New Moon, 1 = Full Moon
  phaseAngleDeg: number;
} {
  const n = jd - J2000_EPOCH_JD;
  const T = n / 36525.0;

  // Mean longitude of Moon
  const Lp = normalizeDegrees(218.3164477 + 481267.88128 * T);
  // Mean elongation
  const D = normalizeDegrees(297.8501921 + 445267.1114034 * T);
  // Sun's mean anomaly
  const M = normalizeDegrees(357.5291092 + 35999.0502909 * T);
  // Moon's mean anomaly
  const Mp = normalizeDegrees(134.9633964 + 477198.8675055 * T);
  // Moon's argument of latitude
  const F = normalizeDegrees(93.272095 + 483202.0175233 * T);

  // Ecliptic longitude perturbing terms (leading terms)
  const lRad = degToRad(
    Lp +
      6.289 * Math.sin(degToRad(Mp)) -
      1.274 * Math.sin(degToRad(Mp - 2 * D)) +
      0.658 * Math.sin(degToRad(2 * D)) -
      0.214 * Math.sin(degToRad(2 * Mp)) -
      0.186 * Math.sin(degToRad(M))
  );

  // Ecliptic latitude perturbing terms
  const bRad = degToRad(
    5.128 * Math.sin(degToRad(F)) +
      0.281 * Math.sin(degToRad(Mp + F)) -
      0.278 * Math.sin(degToRad(Mp - F))
  );

  // Earth-Moon distance (km)
  const distKm =
    385000.56 -
    20905.355 * Math.cos(degToRad(Mp)) -
    3699.111 * Math.cos(degToRad(2 * D - Mp)) -
    2955.968 * Math.cos(degToRad(2 * D));

  const eps = degToRad(23.4392911);

  // Ecliptic coordinates
  const cosB = Math.cos(bRad);
  const sinB = Math.sin(bRad);
  const cosL = Math.cos(lRad);
  const sinL = Math.sin(lRad);

  const xEcl = cosB * cosL;
  const yEcl = cosB * sinL;
  const zEcl = sinB;

  // Transform to Three.js coordinates (+Y = North, X-Z = Equator)
  const xECI = xEcl;
  const yECI = Math.sin(eps) * yEcl + Math.cos(eps) * zEcl;
  const zECI = -(Math.cos(eps) * yEcl - Math.sin(eps) * zEcl);

  // Phase angle between Sun and Moon as seen from Earth
  const phaseAngleDeg = normalizeDegrees(180 - D);
  const phaseFraction = (1 + Math.cos(degToRad(phaseAngleDeg))) / 2;

  return {
    positionECI: { x: xECI, y: yECI, z: zECI },
    distanceKm: distKm,
    phaseFraction,
    phaseAngleDeg,
  };
}

/**
 * Determines whether a 3D position vector in ECI is eclipsed by Earth's cylindrical shadow.
 */
export function isPositionInEarthShadow(
  posKm: Vector3D,
  sunDirECI: Vector3D,
  earthRadiusKm = EARTH_RADIUS_KM
): boolean {
  // Dot product along Sun direction: d = r . s
  const d = posKm.x * sunDirECI.x + posKm.y * sunDirECI.y + posKm.z * sunDirECI.z;
  // If satellite is in the sunlit hemisphere (d >= 0), it is not in shadow
  if (d >= 0) return false;
  // Perpendicular distance squared from Earth-Sun axis
  const rSq = posKm.x * posKm.x + posKm.y * posKm.y + posKm.z * posKm.z;
  const perpDistSq = rSq - d * d;
  return perpDistSq <= earthRadiusKm * earthRadiusKm;
}

/**
 * Computes the geometric eclipse fraction along a circular orbit at altitude hKm when beta angle = 0.
 * In a circular orbit with radius r = R_E + h:
 * Half-angle of eclipse shadow in circular orbit:
 * sin(alpha) = R_E / r
 * Eclipse fraction = 2 * alpha / (2 * pi) = alpha / pi = arcsin(R_E / r) / pi.
 */
export function calculateGeometricEclipseFraction(
  altitudeKm: number,
  earthRadiusKm = EARTH_RADIUS_KM
): number {
  const r = earthRadiusKm + altitudeKm;
  if (r <= earthRadiusKm) return 0.5;
  const alpha = Math.asin(earthRadiusKm / r);
  return alpha / Math.PI;
}

