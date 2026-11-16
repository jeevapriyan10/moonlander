/**
 * Rule validation engine with machine-applicable automated fixes.
 *
 * Implements:
 * - Structured rule diagnostic returns:
 *     { id, severity, title, message, why, cause, fixes }
 * - Plain-language physics explanations for aerospace education
 * - Machine-applicable state patch objects for one-click "Apply fix" UI actions
 * - Error vs Warning distinction (Errors block launch authorization; warnings advise risk)
 */

export type ValidationSeverity = "error" | "warning" | "info";

export interface StatePatch {
  [key: string]: unknown;
}

export interface ValidationFix {
  label: string;
  patch: StatePatch;
}

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  title: string;
  message: string;
  why: string;
  cause: {
    metric: string;
    actual: string | number;
    limit: string | number;
  };
  fixes: ValidationFix[];
}

export interface MissionDesignInputs {
  scenarioId: string;
  isSandbox: boolean;
  busId: string;
  busMaxDryMassKg: number;
  busDiameterM: number;
  totalDryMassKg: number;
  totalWetMassKg: number;
  launcherId: string;
  launcherCapacityKg: number | null;
  launcherFairingDiameterM: number;
  orbitAveragePowerW: number;
  totalLoadW: number;
  arrayAreaM2: number;
  batteryCapacityWhInstalled: number;
  batteryCapacityWhRequired: number;
  adcsPointingDeg: number;
  requiredPointingDeg: number;
  storageInstalledGb: number;
  storageRequiredGb: number;
  dataReturnFraction: number;
  totalMissionCostM: number;
  budgetCapM: number;
  totalScheduleMonths: number;
  deadlineMonths: number;
  totalDoseKrad: number;
  minTidToleranceKrad: number;
  requiresCryo: boolean;
  hasCryocooler: boolean;
  instrumentCount: number;
  recommendedArrayAreaM2?: number;
  recommendedBatteryWh?: number;
  upgradeLauncherId?: string;
  upgradeBusId?: string;
}

/**
 * Runs all aerospace design rules and returns list of actionable validation issues.
 */
export function validateMissionDesign(inputs: MissionDesignInputs): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Payload Instrument Check
  if (inputs.instrumentCount === 0) {
    issues.push({
      id: "no-instruments-selected",
      severity: "error",
      title: "No Scientific Instruments Installed",
      message: "The spacecraft has no scientific payload instruments installed.",
      why: "A space mission without scientific payload instruments cannot gather observational data or fulfill mission objectives.",
      cause: {
        metric: "Installed Instruments",
        actual: 0,
        limit: ">= 1",
      },
      fixes: [],
    });
  }

  // 2. Bus Structural Mass Limit
  if (inputs.totalDryMassKg > inputs.busMaxDryMassKg) {
    const fixes: ValidationFix[] = [];
    if (inputs.upgradeBusId) {
      fixes.push({
        label: "Upgrade to larger spacecraft bus class",
        patch: { busId: inputs.upgradeBusId },
      });
    }

    issues.push({
      id: "mass-bus-exceeded",
      severity: "error",
      title: "Spacecraft Dry Mass Exceeds Bus Capacity",
      message: `Total dry mass (${inputs.totalDryMassKg.toFixed(1)} kg) exceeds the structural maximum (${inputs.busMaxDryMassKg} kg) of the selected bus.`,
      why: "Operating beyond a bus structure's certified mass limit risks mechanical failure during the high acoustic and dynamic g-force environment of launch.",
      cause: {
        metric: "Dry Mass vs Bus Limit",
        actual: `${inputs.totalDryMassKg.toFixed(1)} kg`,
        limit: `${inputs.busMaxDryMassKg} kg`,
      },
      fixes,
    });
  }

  // 3. Launcher Lift Capacity Check
  if (inputs.launcherCapacityKg === null) {
    const fixes: ValidationFix[] = [];
    if (inputs.upgradeLauncherId) {
      fixes.push({
        label: "Switch to capable launcher",
        patch: { launcherId: inputs.upgradeLauncherId },
      });
    }

    issues.push({
      id: "launcher-unsupported-orbit",
      severity: "error",
      title: "Launcher Cannot Reach Target Orbit Class",
      message: "The selected launch vehicle has no certified performance rating to reach the target mission orbit.",
      why: "Launch vehicles vary in upper stage energy. Some light vehicles lack upper stages capable of high-energy orbital injection (e.g. GTO, TLI, TMI).",
      cause: {
        metric: "Launcher Target Orbit Support",
        actual: "Unsupported",
        limit: "Certified Orbit Class",
      },
      fixes,
    });
  } else if (inputs.totalWetMassKg > inputs.launcherCapacityKg) {
    const fixes: ValidationFix[] = [];
    if (inputs.upgradeLauncherId) {
      fixes.push({
        label: `Switch to launcher with >= ${Math.ceil(inputs.totalWetMassKg)} kg capacity`,
        patch: { launcherId: inputs.upgradeLauncherId },
      });
    }

    issues.push({
      id: "mass-launcher-exceeded",
      severity: "error",
      title: "Spacecraft Wet Mass Exceeds Launcher Lift Capacity",
      message: `Spacecraft wet mass (${inputs.totalWetMassKg.toFixed(1)} kg) exceeds launcher payload lift capacity (${inputs.launcherCapacityKg} kg) to this orbit.`,
      why: "A rocket's thrust and propellant limit the total mass it can accelerate to orbital velocity. Overweight payloads fail to achieve stable orbit and burn up in the atmosphere.",
      cause: {
        metric: "Wet Mass vs Launcher Lift",
        actual: `${inputs.totalWetMassKg.toFixed(1)} kg`,
        limit: `${inputs.launcherCapacityKg} kg`,
      },
      fixes,
    });
  }

  // 4. Fairing Static Clearance Check
  if (inputs.busDiameterM > inputs.launcherFairingDiameterM) {
    issues.push({
      id: "fairing-clearance-violation",
      severity: "error",
      title: "Spacecraft Diameter Exceeds Launcher Fairing Envelope",
      message: `Spacecraft bus diameter (${inputs.busDiameterM.toFixed(1)} m) exceeds the launcher payload fairing static envelope (${inputs.launcherFairingDiameterM.toFixed(1)} m).`,
      why: "The satellite must fit inside the aerodynamic fairing with sufficient dynamic acoustic clearance so it does not strike the shroud walls under vibrational deflection.",
      cause: {
        metric: "Bus Diameter vs Fairing",
        actual: `${inputs.busDiameterM.toFixed(1)} m`,
        limit: `${inputs.launcherFairingDiameterM.toFixed(1)} m`,
      },
      fixes: inputs.upgradeLauncherId
        ? [{ label: "Switch to heavy-lift wide-fairing launcher", patch: { launcherId: inputs.upgradeLauncherId } }]
        : [],
    });
  }

  // 5. Power Balance Check (Generation vs Load)
  if (inputs.orbitAveragePowerW < inputs.totalLoadW) {
    const fixes: ValidationFix[] = [];
    if (inputs.recommendedArrayAreaM2) {
      fixes.push({
        label: `Increase solar array area to ${inputs.recommendedArrayAreaM2.toFixed(1)} m²`,
        patch: { solarArrayAreaM2: inputs.recommendedArrayAreaM2 },
      });
    }

    issues.push({
      id: "power-deficit-sunlit",
      severity: "error",
      title: "Negative Electrical Power Balance",
      message: `Orbit-average solar generation (${inputs.orbitAveragePowerW.toFixed(0)} W) is less than average electrical load (${inputs.totalLoadW.toFixed(0)} W).`,
      why: "A spacecraft operating with a negative energy balance will continuously deplete its battery bank until catastrophic brownout and bus shutdown occur.",
      cause: {
        metric: "Average Power Generation vs Load",
        actual: `${inputs.orbitAveragePowerW.toFixed(0)} W`,
        limit: `>= ${inputs.totalLoadW.toFixed(0)} W`,
      },
      fixes,
    });
  }

  // 6. Battery Eclipse Capacity Check
  if (inputs.batteryCapacityWhInstalled < inputs.batteryCapacityWhRequired) {
    const fixes: ValidationFix[] = [];
    if (inputs.recommendedBatteryWh) {
      fixes.push({
        label: `Install battery with >= ${inputs.recommendedBatteryWh.toFixed(0)} Wh capacity`,
        patch: { batteryCapacityWh: inputs.recommendedBatteryWh },
      });
    }

    issues.push({
      id: "battery-capacity-deficit",
      severity: "error",
      title: "Insufficient Battery Storage for Eclipse",
      message: `Installed battery capacity (${inputs.batteryCapacityWhInstalled.toFixed(0)} Wh) is below required storage (${inputs.batteryCapacityWhRequired.toFixed(0)} Wh) for eclipse pass.`,
      why: "When passing through planetary shadow, all solar power ceases. Sizing battery capacity to avoid exceeding Depth of Discharge limits prevents cell degradation and brownout.",
      cause: {
        metric: "Battery Capacity vs Eclipse Need",
        actual: `${inputs.batteryCapacityWhInstalled.toFixed(0)} Wh`,
        limit: `>= ${inputs.batteryCapacityWhRequired.toFixed(0)} Wh`,
      },
      fixes,
    });
  }

  // 7. Attitude Determination & Control System (ADCS) Pointing
  if (inputs.adcsPointingDeg > inputs.requiredPointingDeg) {
    issues.push({
      id: "pointing-accuracy-insufficient",
      severity: "error",
      title: "ADCS Pointing Stability Coarser than Instrument Requirement",
      message: `Selected ADCS control accuracy (${inputs.adcsPointingDeg}°) cannot achieve the precision (${inputs.requiredPointingDeg}°) required by installed scientific payloads.`,
      why: "Narrow-field telescopes, star surveys, and high-resolution Earth imagers require tight boresight stabilization (reaction wheels and star trackers) to avoid optical motion blur.",
      cause: {
        metric: "ADCS Control Accuracy",
        actual: `${inputs.adcsPointingDeg}°`,
        limit: `<= ${inputs.requiredPointingDeg}°`,
      },
      fixes: [
        inputs.requiredPointingDeg <= 0.005 || inputs.adcsPointingDeg <= 0.01
          ? {
              label: "Upgrade to Ultra-Fine Pointing Bench (0.001°)",
              patch: { adcsId: "adcs-fine-pointing" },
            }
          : {
              label: "Upgrade to Reaction Wheels + Star Tracker (0.01°)",
              patch: { adcsId: "adcs-reaction-wheels" },
            },
      ],
    });
  }

  // 8. Infrared Cryocooler Check
  if (inputs.requiresCryo && !inputs.hasCryocooler) {
    issues.push({
      id: "cryo-cooler-missing",
      severity: "error",
      title: "Missing Cryocooler for Infrared Sensor",
      message: "One or more installed instruments require cryogenic cooling, but the thermal control subsystem lacks an active cryocooler.",
      why: "Thermal Infrared focal plane detectors must be cooled down to ~65-80 Kelvin to suppress background thermal photon noise; passive radiators alone cannot reach this temperature in Earth orbit.",
      cause: {
        metric: "Cryogenic Cooling Support",
        actual: "Not Installed",
        limit: "Active Cryocooler Required",
      },
      fixes: [
        {
          label: "Switch thermal subsystem to Active Cryocooler",
          patch: { thermalId: "thermal-cryocooler" },
        },
      ],
    });
  }

  // 9. Onboard Data Storage Buffer
  if (inputs.storageInstalledGb < inputs.storageRequiredGb) {
    issues.push({
      id: "storage-overflow-warning",
      severity: "warning",
      title: "Onboard Solid-State Storage Buffer Under 1.5 Days",
      message: `Installed storage (${inputs.storageInstalledGb} GB) provides less than the recommended 1.5-day safety margin (${inputs.storageRequiredGb.toFixed(0)} GB) for missed ground passes.`,
      why: "If a scheduled ground station contact is scrubbed due to terrestrial weather or station maintenance, a shallow memory buffer risks overwriting science data.",
      cause: {
        metric: "Onboard Storage Margin",
        actual: `${inputs.storageInstalledGb} GB`,
        limit: `>= ${inputs.storageRequiredGb.toFixed(0)} GB`,
      },
      fixes: [
        {
          label: "Upgrade onboard SSR storage capacity",
          patch: { storageGb: Math.ceil(inputs.storageRequiredGb * 1.5) },
        },
      ],
    });
  }

  // 10. Science Downlink Bottleneck
  if (inputs.dataReturnFraction < 0.9) {
    issues.push({
      id: "downlink-bottleneck-warning",
      severity: "warning",
      title: "Science Downlink Bottleneck (<90% Return)",
      message: `Downlink throughput satisfies only ${(inputs.dataReturnFraction * 100).toFixed(0)}% of daily scientific data production.`,
      why: "Payload instruments are generating more bits than the RF communications link and ground pass schedule can transmit back to Earth.",
      cause: {
        metric: "Data Return Fraction",
        actual: `${(inputs.dataReturnFraction * 100).toFixed(0)}%`,
        limit: ">= 90%",
      },
      fixes: [
        {
          label: "Upgrade to High-Rate X-band / Ka-band Transceiver",
          patch: { commsId: "comms-x-band" },
        },
      ],
    });
  }

  // 11. Radiation Dose vs Avionics TID Tolerance
  if (inputs.totalDoseKrad > inputs.minTidToleranceKrad) {
    issues.push({
      id: "radiation-dose-exceeded",
      severity: "error",
      title: "Cumulative Radiation Dose Exceeds Avionics TID Tolerance",
      message: `Projected mission ionizing radiation dose (${inputs.totalDoseKrad.toFixed(1)} krad) exceeds component silicon TID tolerance (${inputs.minTidToleranceKrad} krad).`,
      why: "High energy protons and trapped belt electrons create crystal lattice defects and gate oxide charge trapping, leading to latch-up and flight computer failure.",
      cause: {
        metric: "Mission Dose vs TID Tolerance",
        actual: `${inputs.totalDoseKrad.toFixed(1)} krad`,
        limit: `<= ${inputs.minTidToleranceKrad} krad`,
      },
      fixes: [
        {
          label: "Upgrade to Rad-Hard Flight Computer (RAD750-class)",
          patch: { flightComputerId: "fc-rad-hard" },
        },
      ],
    });
  }

  // 12. Budget Cap (Enforced unless Sandbox mode)
  if (!inputs.isSandbox && inputs.totalMissionCostM > inputs.budgetCapM) {
    issues.push({
      id: "budget-exceeded",
      severity: "error",
      title: "Mission Cost Exceeds Allocated Budget Cap",
      message: `Total lifecycle cost ($${inputs.totalMissionCostM.toFixed(1)}M) exceeds scenario funding allocation ($${inputs.budgetCapM.toFixed(1)}M).`,
      why: "Space agencies and commercial programs face firm funding ceilings. Cost overruns require hardware descoping or mission cancellation before flight.",
      cause: {
        metric: "Total Cost vs Budget Cap",
        actual: `$${inputs.totalMissionCostM.toFixed(1)}M`,
        limit: `$${inputs.budgetCapM.toFixed(1)}M`,
      },
      fixes: [],
    });
  }

  // 13. Schedule Deadline (Enforced unless Sandbox mode)
  if (!inputs.isSandbox && inputs.totalScheduleMonths > inputs.deadlineMonths) {
    issues.push({
      id: "deadline-exceeded",
      severity: "error",
      title: "Development Schedule Exceeds Launch Deadline",
      message: `Projected delivery (${inputs.totalScheduleMonths} months) breaches scenario target launch window (${inputs.deadlineMonths} months).`,
      why: "Planetary orbital alignments and mission launch manifests have strict orbital insertion deadlines. Low-TRL parallel technologies delay delivery.",
      cause: {
        metric: "Schedule vs Deadline",
        actual: `${inputs.totalScheduleMonths} months`,
        limit: `${inputs.deadlineMonths} months`,
      },
      fixes: [],
    });
  }

  return issues;
}
