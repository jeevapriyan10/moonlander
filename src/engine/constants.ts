/**
 * Astrodynamics and physical constants for the MoonLander / MissionForge engine.
 * Sources:
 * - NASA Reference Publication 1207 / JPL Planetary Ephemeris
 * - WGS-84 Earth Gravitational Model (muEarth, R_E, J2)
 * - CODATA recommended values of physical constants
 * - Standard solar irradiance at 1 AU (ASTM E490-00a)
 */

/** Standard gravitational parameter of Earth in km^3 / s^2 */
export const MU_EARTH_KM3_S2 = 398600.4418;

/** Earth equatorial radius in km (WGS-84) */
export const R_EARTH_KM = 6378.137;

/** Earth oblateness / second zonal harmonic coefficient J2 */
export const J2_EARTH = 1.08263e-3;

/** Standard gravity at Earth surface in m / s^2 */
export const G0_M_S2 = 9.80665;

/** Solar constant at Earth (1 AU) in W / m^2 (ASTM E490 AM0) */
export const SOLAR_CONSTANT_EARTH_W_M2 = 1361;

/** Solar constant at Mars (1.524 AU) in W / m^2 */
export const SOLAR_CONSTANT_MARS_W_M2 = 586;

/** Astronomical Unit in km (IAU 2012) */
export const AU_KM = 149597870.7;

/** Seconds in a standard solar day */
export const SECONDS_PER_DAY = 86400;

/** Default ground station minimum elevation angle in degrees */
export const DEFAULT_MIN_ELEVATION_DEG = 10.0;

/** Speed of light in vacuum in km / s */
export const SPEED_OF_LIGHT_KM_S = 299792.458;
