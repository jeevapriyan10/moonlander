import { describe, it, expect } from "vitest";
import {
  toJulianDate,
  fromJulianDate,
  computeGMST,
  computeSunDirectionECI,
  computeSolarDeclinationDeg,
  computeSubSolarLatLon,
  latLonToVector3,
  vector3ToLatLon,
  eciToEcef,
  ecefToEci,
  computeMoonState,
  isPositionInEarthShadow,
  calculateGeometricEclipseFraction,
  GROUND_SITES,
  J2000_EPOCH_JD,
} from "./astro";

describe("Real Astronomy Engine (astro.ts)", () => {
  it("computes exact Julian Date at J2000.0 epoch", () => {
    // 2000-01-01 12:00:00 UTC
    const epochDate = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const jd = toJulianDate(epochDate);
    expect(jd).toBeCloseTo(J2000_EPOCH_JD, 8);

    const roundTrip = fromJulianDate(jd);
    expect(roundTrip.toISOString()).toBe("2000-01-01T12:00:00.000Z");
  });

  it("verifies GMST at J2000.0 = 280.46 deg (±0.01)", () => {
    const gmst = computeGMST(J2000_EPOCH_JD);
    expect(gmst).toBeCloseTo(280.4606, 2);
    expect(Math.abs(gmst - 280.46)).toBeLessThan(0.01);
  });

  it("calculates solar declination ~ +23.4 deg at June solstice and ~ 0 deg at March equinox", () => {
    // 2024 June Solstice: ~ June 20, 2024 20:50 UTC
    const juneSolstice = new Date(Date.UTC(2024, 5, 20, 20, 50, 0));
    const jdJune = toJulianDate(juneSolstice);
    const decJune = computeSolarDeclinationDeg(jdJune);
    // Solstice maximum obliquity ~ 23.44 deg (+- 0.3)
    expect(decJune).toBeGreaterThan(23.1);
    expect(decJune).toBeLessThan(23.7);

    // 2024 March Equinox: ~ March 20, 2024 03:06 UTC
    const marchEquinox = new Date(Date.UTC(2024, 2, 20, 3, 6, 0));
    const jdMarch = toJulianDate(marchEquinox);
    const decMarch = computeSolarDeclinationDeg(jdMarch);
    // Equinox declination ~ 0 (+- 0.5 deg)
    expect(Math.abs(decMarch)).toBeLessThan(0.5);

    // 2024 December Solstice: ~ Dec 21, 2024
    const decSolstice = new Date(Date.UTC(2024, 11, 21, 9, 20, 0));
    const jdDec = toJulianDate(decSolstice);
    const decDec = computeSolarDeclinationDeg(jdDec);
    expect(decDec).toBeLessThan(-23.1);
    expect(decDec).toBeGreaterThan(-23.7);
  });

  it("verifies sub-solar longitude moves ~15 deg/hour westwards", () => {
    const t0 = new Date(Date.UTC(2024, 5, 1, 12, 0, 0));
    const t1 = new Date(Date.UTC(2024, 5, 1, 13, 0, 0)); // 1 hour later

    const p0 = computeSubSolarLatLon(toJulianDate(t0));
    const p1 = computeSubSolarLatLon(toJulianDate(t1));

    // Earth rotates eastward, so subsolar point moves WEST (-15 deg/hr longitude)
    let lonDiff = p0.lonDeg - p1.lonDeg;
    if (lonDiff < 0) lonDiff += 360;
    expect(lonDiff).toBeCloseTo(15.0, 0); // ~15 deg / hour
    expect(Math.abs(lonDiff - 15.0)).toBeLessThan(0.2);
  });

  it("verifies latLonToVector3 and vector3ToLatLon round-trip error < 1e-9", () => {
    const testCases = [
      { latDeg: 0, lonDeg: 0 },
      { latDeg: 45, lonDeg: 90 },
      { latDeg: -33.86, lonDeg: 151.2 },
      { latDeg: 13.08, lonDeg: 80.27 }, // Chennai
      { latDeg: 28.57, lonDeg: -80.65 }, // KSC
      { latDeg: 89.9, lonDeg: -45.0 },
      { latDeg: -89.9, lonDeg: 120.0 },
    ];

    for (const tc of testCases) {
      const v = latLonToVector3(tc.latDeg, tc.lonDeg, 1.0);
      const rt = vector3ToLatLon(v, 1.0);
      expect(Math.abs(rt.latDeg - tc.latDeg)).toBeLessThan(1e-9);
      expect(Math.abs(rt.lonDeg - tc.lonDeg)).toBeLessThan(1e-9);
    }
  });

  it("maps Chennai (13.08N, 80.27E) to expected 3D Cartesian coordinates", () => {
    const v = latLonToVector3(13.08, 80.27, 1.0);

    // Lat is North -> Y > 0
    expect(v.y).toBeCloseTo(Math.sin((13.08 * Math.PI) / 180), 6);
    // Lon is 80.27E (Eastern hemisphere in Three.js SphereGeometry: X > 0, Z < 0)
    expect(v.x).toBeGreaterThan(0);
    expect(v.z).toBeLessThan(0);
    // Unit length
    const len = Math.hypot(v.x, v.y, v.z);
    expect(len).toBeCloseTo(1.0, 9);
  });

  it("validates ground stations and launch sites catalogue coordinates", () => {
    expect(GROUND_SITES.sriharikota.latDeg).toBeCloseTo(13.72, 2);
    expect(GROUND_SITES.sriharikota.lonDeg).toBeCloseTo(80.23, 2);

    expect(GROUND_SITES.kennedy.latDeg).toBeCloseTo(28.57, 2);
    expect(GROUND_SITES.kennedy.lonDeg).toBeCloseTo(-80.65, 2);

    expect(GROUND_SITES.kourou.latDeg).toBeCloseTo(5.24, 2);
    expect(GROUND_SITES.kourou.lonDeg).toBeCloseTo(-52.77, 2);

    expect(GROUND_SITES.vandenberg.latDeg).toBeCloseTo(34.74, 2);
    expect(GROUND_SITES.vandenberg.lonDeg).toBeCloseTo(-120.57, 2);

    expect(GROUND_SITES.baikonur.latDeg).toBeCloseTo(45.96, 2);
    expect(GROUND_SITES.baikonur.lonDeg).toBeCloseTo(63.3, 2);
  });

  it("verifies ECI <-> ECEF coordinate transformation reversibility", () => {
    const vECI = { x: 0.707, y: 0.5, z: 0.5 };
    const gmst = 135.5;
    const vECEF = eciToEcef(vECI, gmst);
    const roundTrip = ecefToEci(vECEF, gmst);

    expect(roundTrip.x).toBeCloseTo(vECI.x, 9);
    expect(roundTrip.y).toBeCloseTo(vECI.y, 9);
    expect(roundTrip.z).toBeCloseTo(vECI.z, 9);
  });

  it("computes realistic lunar position and phase illumination", () => {
    // 2024 August 19: Full Supermoon (illuminated fraction ~ 1.0)
    const fullMoonDate = new Date(Date.UTC(2024, 7, 19, 18, 25, 0));
    const stateFull = computeMoonState(toJulianDate(fullMoonDate));
    expect(stateFull.distanceKm).toBeGreaterThan(356000);
    expect(stateFull.distanceKm).toBeLessThan(407000);
    expect(stateFull.phaseFraction).toBeGreaterThan(0.95);

    // 2024 August 4: New Moon (illuminated fraction ~ 0.0)
    const newMoonDate = new Date(Date.UTC(2024, 7, 4, 11, 13, 0));
    const stateNew = computeMoonState(toJulianDate(newMoonDate));
    expect(stateNew.phaseFraction).toBeLessThan(0.08);
  });

  it("validates eclipse geometry and agreement with orbital eclipse fraction for beta=0", () => {
    // Sun at +X
    const sunDir = { x: 1, y: 0, z: 0 };

    // Satellite at +X (noon) -> not in shadow
    expect(isPositionInEarthShadow({ x: 7000, y: 0, z: 0 }, sunDir)).toBe(false);

    // Satellite at -X (midnight, 7000 km) -> inside shadow cylinder
    expect(isPositionInEarthShadow({ x: -7000, y: 0, z: 0 }, sunDir)).toBe(true);

    // Satellite at -X but displaced by 7000 km along Y (above North Pole) -> outside shadow cylinder
    expect(isPositionInEarthShadow({ x: -7000, y: 7000, z: 0 }, sunDir)).toBe(false);

    // For LEO at 400 km: r = 6378 + 400 = 6778 km
    // Geometric eclipse fraction = arcsin(6378.137 / 6778.137) / pi ~ 0.389 rad / pi ~ 0.390
    const frac400 = calculateGeometricEclipseFraction(400);
    expect(frac400).toBeGreaterThan(0.35);
    expect(frac400).toBeLessThan(0.42);

    // For SSO at 700 km: r = 6378 + 700 = 7078 km
    const frac700 = calculateGeometricEclipseFraction(700);
    expect(frac700).toBeGreaterThan(0.32);
    expect(frac700).toBeLessThan(0.38);
  });
});
