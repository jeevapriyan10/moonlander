/**
 * MoonLander Plain-Language Translation Utility
 *
 * When Plain Language Mode is active, technical aerospace jargon,
 * military-standard acronyms, and specialized astrodynamics terms
 * are converted into intuitive, accessible plain-English phrases.
 */

export const PLAIN_LANGUAGE_MAP: Record<string, string> = {
  // Systems & Subsystems
  "ADCS": "Steering & Pointing",
  "Attitude Determination and Control System": "Steering & Pointing Control",
  "Avionics": "Computers & Guidance",
  "Bus": "Spacecraft Chassis",
  "Propulsion": "Thrusters & Engines",
  "Comms": "Radio & Data Link",
  "Communications": "Radio & Data Link",
  "Thermal": "Temperature Control",
  "Thermal Control": "Temperature Control",
  "Payload": "Scientific Instruments",
  "Flight Computer": "Main Guidance Computer",
  "Solid State Recorder": "Onboard Data Storage",

  // Astrodynamics & Propulsion
  "Delta-V": "Maneuver Fuel Speed (Δv)",
  "Delta-v": "Maneuver Fuel Speed (Δv)",
  "Specific Impulse": "Engine Fuel Efficiency (Isp)",
  "Specific Impulse (Isp)": "Engine Fuel Efficiency (Isp)",
  "Isp": "Fuel Efficiency (Isp)",
  "Tsiolkovsky Rocket Equation": "Rocket Fuel vs Payload Law",
  "Hohmann Transfer": "Most Efficient Orbital Shift",
  "Bi-elliptic Transfer": "High-Altitude Orbit Shift",
  "Semi-Major Axis": "Average Orbit Distance",
  "Eccentricity": "Orbit Oval Shape (0=Circle)",
  "Inclination": "Orbit Tilt vs Equator",
  "RAAN": "Orbit East-West Orientation",
  "Argument of Periapsis": "Closest Point Angle",
  "True Anomaly": "Current Position in Orbit",
  "Apoapsis": "Highest Orbital Point",
  "Periapsis": "Lowest Orbital Point",
  "Apogee": "Highest Altitude above Earth",
  "Perigee": "Lowest Altitude above Earth",
  "J2 Perturbation": "Earth Bulge Gravity Wobble",

  // Orbits
  "LEO": "Low Earth Orbit (Close-in)",
  "SSO": "Constant-Sunlight Orbit (Polar)",
  "Sun-Synchronous": "Constant-Sunlight Orbit",
  "Sun-Synchronous Orbit": "Constant-Sunlight Orbit",
  "GEO": "Stationary Earth Orbit (24h)",
  "GTO": "Geostationary Transfer Highway",
  "HEO": "High Oval Orbit (Long dwell)",
  "Molniya": "High Oval Orbit (Northern coverage)",
  "TLI": "Trans-Lunar Moon Injection",
  "TMI": "Trans-Mars Injection",
  "Lagrange Point": "Gravitational Balance Pocket",
  "L1": "Sun-Earth Gravity Balance 1",
  "L2": "Deep Space Shadow Pocket 2",

  // Operations & Comms
  "Link Margin": "Signal Strength Safety Buffer",
  "Downlink": "Data Return to Ground",
  "Uplink": "Commands Sent to Satellite",
  "Ground Station Pass": "Overflight Communication Window",
  "Bit Error Rate": "Signal Transmission Noise",
  "Free-Space Path Loss": "Radio Signal Weakening over Distance",
  "TT&C": "Tracking, Telemetry & Command",
  "FDIR": "Automatic Emergency Recovery System",
  "Safe Mode": "Low-Power Survival Mode",

  // Power & Environment
  "Eclipse DOD": "Battery Drain Per Orbit",
  "Depth of Discharge (DOD)": "Battery Drain Percentage",
  "Solar Beta Angle": "Orbit Sunlight Exposure Angle",
  "Eclipse Fraction": "Percentage of Orbit in Darkness",
  "Solar Flux": "Sunlight Power Intensity",
  "SEU": "Cosmic Radiation Bit-Flip",
  "Single Event Upset (SEU)": "Cosmic Radiation Bit-Flip",
  "TID": "Lifetime Radiation Wear",
  "Total Ionizing Dose (TID)": "Lifetime Radiation Wear",
  "Van Allen Belts": "Earth High-Radiation Zones",
  "South Atlantic Anomaly": "Low-Altitude Radiation Hotspot",
  "TRL": "Technology Maturity Level",
  "Technology Readiness Level": "Technology Maturity Level",
  "Mass Margin": "Extra Rocket Weight Buffer",
  "Power Margin": "Extra Electricity Buffer",
  "Wet Mass": "Total Launch Weight (with fuel)",
  "Dry Mass": "Empty Spacecraft Weight (no fuel)",
};

/**
 * Translates a technical aerospace term or acronym into its plain-language equivalent
 * if `isPlainLanguage` is true. Otherwise returns the original term.
 */
export function toPlainLanguage(term: string, isPlainLanguage: boolean): string {
  if (!isPlainLanguage) return term;
  if (!term) return "";

  // Exact match
  if (PLAIN_LANGUAGE_MAP[term]) {
    return PLAIN_LANGUAGE_MAP[term];
  }

  // Case-insensitive match
  const lower = term.toLowerCase();
  for (const [key, value] of Object.entries(PLAIN_LANGUAGE_MAP)) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }

  return term;
}
