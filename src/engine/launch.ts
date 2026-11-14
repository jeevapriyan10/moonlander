/**
 * Launch simulation and probabilistic outcome resolution engine module.
 *
 * Implements:
 * - Deterministic outcome resolution via Mulberry32 seeded PRNG
 * - Launch success probability:
 *     P_success = launcherReliability * (1 - 0.003 * riskScore), clamped to [0.05, 0.999]
 * - Root-cause diagnostic attribution:
 *     Identifies whether an abort/failure was driven by vehicle hardware anomaly vs design margins
 * - Plausible mission launch timeline with T+ event timestamps
 */

import { createRNG } from "./rng";

export interface LauncherSpec {
  id: string;
  name: string;
  manufacturer: string;
  capacityKg: {
    leo: number | null;
    sso: number | null;
    gto: number | null;
    tli: number | null;
    tmi: number | null;
  };
  priceM: number;
  fairingDiameterM: number;
  reliability: number; // e.g. 0.99, 0.95, 0.92
  firstFlightYear: number;
  stages: number;
}

export interface LaunchTimelineEvent {
  tPlusSeconds: number;
  phase: "ignition" | "max_q" | "meco" | "fairing_sep" | "seco_1" | "orbit_insertion" | "spacecraft_sep";
  title: string;
  telemetryNote: string;
}

export interface LaunchOutcome {
  success: boolean;
  probability: number;
  roll: number;
  failurePhase?: LaunchTimelineEvent["phase"];
  failureCause?: string;
  failureIsDesignDriven?: boolean;
  timeline: LaunchTimelineEvent[];
}

export const STANDARD_LAUNCH_TIMELINE: LaunchTimelineEvent[] = [
  {
    tPlusSeconds: 0,
    phase: "ignition",
    title: "Ignition & Liftoff",
    telemetryNote: "All main engines to full thrust. Vehicle has cleared the launch tower.",
  },
  {
    tPlusSeconds: 68,
    phase: "max_q",
    title: "Max-Q",
    telemetryNote: "Vehicle passing through maximum aerodynamic dynamic pressure.",
  },
  {
    tPlusSeconds: 154,
    phase: "meco",
    title: "MECO & Stage 1 Separation",
    telemetryNote: "First stage shutdown nominal. Pneumatic stage separation confirmed.",
  },
  {
    tPlusSeconds: 212,
    phase: "fairing_sep",
    title: "Payload Fairing Jettison",
    telemetryNote: "Fairing halves deployed. Spacecraft exposed to space environment.",
  },
  {
    tPlusSeconds: 520,
    phase: "seco_1",
    title: "SECO-1 (Parking Orbit)",
    telemetryNote: "Second stage shutdown. Vehicle in stable low parking orbit.",
  },
  {
    tPlusSeconds: 1680,
    phase: "orbit_insertion",
    title: "Target Orbit Insertion Burn",
    telemetryNote: "Upper stage restart for target orbital injection.",
  },
  {
    tPlusSeconds: 1920,
    phase: "spacecraft_sep",
    title: "Spacecraft Separation & Signal Acquisition",
    telemetryNote: "Payload clamp-band release confirmed. Spacecraft telemetry signal acquired.",
  },
];

/**
 * Resolves launch outcome deterministically given the mission risk and vehicle seed.
 */
export function simulateLaunch(
  launcher: LauncherSpec,
  riskScore: number,
  seed: string,
  designErrorsPresent = false,
  overCapacity = false,
  fairingInterference = false
): LaunchOutcome {
  const rng = createRNG(seed);
  const roll = rng();

  // If critical design errors exist, launch fails deterministically
  if (designErrorsPresent || overCapacity || fairingInterference) {
    let failureCause = "Spacecraft launch aborted due to unresolved design constraint violations.";
    let failurePhase: LaunchTimelineEvent["phase"] = "ignition";

    if (overCapacity) {
      failurePhase = "meco";
      failureCause = "Payload wet mass exceeded launcher payload capacity envelope. Booster trajectory deficit.";
    } else if (fairingInterference) {
      failurePhase = "fairing_sep";
      failureCause = "Spacecraft envelope violated fairing static clearance envelope; physical contact during separation.";
    }

    return {
      success: false,
      probability: 0,
      roll,
      failurePhase,
      failureCause,
      failureIsDesignDriven: true,
      timeline: STANDARD_LAUNCH_TIMELINE,
    };
  }

  // P_success = launcherReliability * (1 - 0.003 * riskScore) clamped
  const rawProb = launcher.reliability * (1 - 0.003 * riskScore);
  const probability = Math.max(0.05, Math.min(0.999, Math.round(rawProb * 1000) / 1000));

  const success = roll <= probability;

  if (success) {
    return {
      success: true,
      probability,
      roll: Math.round(roll * 1000) / 1000,
      timeline: STANDARD_LAUNCH_TIMELINE,
    };
  }

  // Failure attribution
  const isDesignDriven = roll > launcher.reliability && riskScore > 35;
  let failurePhase: LaunchTimelineEvent["phase"] = "meco";
  let failureCause = "Booster propulsion turbopump anomaly during first stage ascent.";

  if (isDesignDriven) {
    if (riskScore > 60) {
      failurePhase = "orbit_insertion";
      failureCause = "Low-TRL subsystem power brownout and thermal shock during target orbital injection burn.";
    } else {
      failurePhase = "max_q";
      failureCause = "Structural resonance failure along payload adapter due to thin structural mass margins.";
    }
  } else {
    // Hardware vehicle anomaly
    if (roll < 0.3) {
      failurePhase = "meco";
      failureCause = "Premature first-stage main engine shutdown due to hydraulic pressure loss.";
    } else if (roll < 0.6) {
      failurePhase = "fairing_sep";
      failureCause = "Unbalanced pyrotechnic release mechanism failure during fairing jettison.";
    } else {
      failurePhase = "orbit_insertion";
      failureCause = "Upper stage vacuum engine restart ignition anomaly.";
    }
  }

  return {
    success: false,
    probability,
    roll: Math.round(roll * 1000) / 1000,
    failurePhase,
    failureCause,
    failureIsDesignDriven: isDesignDriven,
    timeline: STANDARD_LAUNCH_TIMELINE,
  };
}
