/**
 * MoonLander Operations Simulation Engine
 * Pure deterministic time-stepped simulation of spacecraft on-orbit operations.
 *
 * Simulates:
 * - Battery charge/discharge cycles in sunlight vs eclipse
 * - Solar array output degradation over mission lifetime
 * - Thermal equilibrium hot/cold cases
 * - Propellant consumption for station-keeping and maneuvers
 * - Cumulative science data collection and ground station downlinks
 * - Space weather & orbital anomaly injections with interactive decision branches
 * - NASA Standard Operating Procedure (SOP) Autopilot resolution
 */

import { createRNG } from "../rng";
import type { MissionDesignConfig, MissionEvaluation } from "../evaluate";
import type {
  TelemetrySnapshot,
  OperationalEvent,
  DecisionOption,
  SimulationResult,
} from "./types";
import eventsRaw from "@/data/events.json";

export interface SimulatorOptions {
  durationDays?: number;
  sampleSteps?: number;
  decisionOverrides?: Record<string, string>; // eventId -> optionId
  autopilot?: boolean;
}

/**
 * Runs a deterministic time-stepped simulation of the mission.
 */
export function runMissionSimulation(
  design: MissionDesignConfig,
  evaluation: MissionEvaluation,
  options: SimulatorOptions = {}
): SimulationResult {
  const rng = createRNG(`${design.seed}-ops-v1`);

  const durationDays = options.durationDays ?? Math.min(365, Math.max(30, evaluation.orbit.periodSeconds > 0 ? 365 : 60));
  const numSteps = options.sampleSteps ?? 60;
  const stepDays = durationDays / numSteps;

  const autopilot = options.autopilot ?? false;
  const decisionOverrides = options.decisionOverrides ?? {};

  // Base physics metrics from evaluation
  const baseSolarW = evaluation.power.orbitAverageGenerationW;
  const baseLoadW = evaluation.power.totalLoadW;
  const batteryCapWh = design.batteryCapacityWh;
  const annualDegradation = 0.025; // ~2.5%/year
  const dailyStationKeepingFuelKg = evaluation.propulsion.breakdown.stationKeepingPerYearMs > 0
    ? (evaluation.propulsion.breakdown.stationKeepingPerYearMs / 365.25) * 0.005
    : 0.002;

  let currentPropellantKg = design.propellantMassKg;
  let cumulativeScienceGb = 0;
  let cumulativeRadiationKrad = 0;
  let currentBufferGb = 0;
  const maxStorageGb = design.storageGb;

  const dailyGenScienceGb = evaluation.comms.dataGeneratedGbPerDay;
  const dailyDownlinkGb = evaluation.comms.downlinkCapacityGbPerDay;

  // Clone available events catalog
  const catalogEvents: OperationalEvent[] = JSON.parse(JSON.stringify(eventsRaw));

  // Deterministically select 2-3 events for this mission seed
  const selectedEvents: OperationalEvent[] = [];
  const eventIndices = [0, 1, 2, 3, 4, 5].sort(() => rng() - 0.5);

  const numEventsToInject = 2 + Math.floor(rng() * 2); // 2 or 3 events
  for (let i = 0; i < numEventsToInject && i < eventIndices.length; i++) {
    const rawEvt = catalogEvents[eventIndices[i]!];
    if (rawEvt) {
      // Space event triggers across the mission duration
      const triggerFrac = 0.15 + (i / numEventsToInject) * 0.7 + (rng() * 0.1 - 0.05);
      rawEvt.triggerDay = Math.round(triggerFrac * durationDays);
      selectedEvents.push(rawEvt);
    }
  }

  // Sort events chronologically
  selectedEvents.sort((a, b) => a.triggerDay - b.triggerDay);

  let scienceMultiplierTotal = 1.0;
  let anomaliesResolved = 0;
  const criticalFailures: string[] = [];

  // Telemetry history buffer
  const timeline: TelemetrySnapshot[] = [];

  for (let step = 0; step <= numSteps; step++) {
    const currentDay = Math.min(durationDays, Math.round(step * stepDays * 10) / 10);
    const dayFrac = durationDays > 0 ? currentDay / durationDays : 0;

    // Solar degradation factor over time
    const degradationFactor = Math.max(0.7, 1 - (annualDegradation * currentDay) / 365.25);
    const currentSolarW = Math.round(baseSolarW * degradationFactor * 10) / 10;

    // Battery State of Charge (%)
    // Oscillates slightly based on diurnal eclipse duty cycle (~88% to 98% nominal)
    const eclipseCycleVariation = Math.sin((currentDay * 2 * Math.PI) / 1.5) * 6;
    const baseSoC = evaluation.power.depthOfDischargeUsed
      ? Math.max(20, Math.min(100, 100 - evaluation.power.depthOfDischargeUsed * 100 * 0.8 + eclipseCycleVariation))
      : 92 + eclipseCycleVariation;

    // Spacecraft internal temperature (°C)
    // Thermal balance oscillates between hot and cold pass around nominal 18°C
    const thermalOscillation = Math.cos((currentDay * 2 * Math.PI) / 2.0) * 8;
    const currentTempC = Math.round((18.5 + thermalOscillation) * 10) / 10;

    // Propellant depletion
    currentPropellantKg = Math.max(0, currentPropellantKg - dailyStationKeepingFuelKg * stepDays);

    // Science data accumulation & downlink
    const stepScienceGenGb = dailyGenScienceGb * stepDays * scienceMultiplierTotal;
    const stepDownlinkCapGb = dailyDownlinkGb * stepDays;

    currentBufferGb = Math.max(0, Math.min(maxStorageGb, currentBufferGb + stepScienceGenGb - stepDownlinkCapGb));
    cumulativeScienceGb += Math.min(stepDownlinkCapGb, currentBufferGb + stepScienceGenGb);

    // Cumulative radiation dose (krad)
    const dailyRadKrad = (evaluation.radiation.annualDoseKrad || 2.0) / 365.25;
    cumulativeRadiationKrad = Math.round((cumulativeRadiationKrad + dailyRadKrad * stepDays) * 100) / 100;

    // Check if an event triggers at this step
    let activeStatus: TelemetrySnapshot["activeStatus"] = "nominal";
    let anomalyDetected = false;

    for (const evt of selectedEvents) {
      if (Math.abs(currentDay - evt.triggerDay) < stepDays * 0.75) {
        anomalyDetected = true;
        activeStatus = evt.severity === "critical" ? "critical" : evt.severity === "high" ? "alert" : "warning";

        // Resolve event if not yet resolved
        if (!evt.resolved) {
          const chosenOptionId = decisionOverrides[evt.id] ?? (autopilot ? evt.options.find((o) => o.nasaSopRecommended)?.id ?? evt.options[0]?.id : undefined);

          if (chosenOptionId) {
            const opt = evt.options.find((o) => o.id === chosenOptionId) ?? evt.options[0]!;
            evt.resolved = true;
            evt.selectedOptionId = opt.id;
            evt.resolutionLog = opt.outcomeMessage;

            // Apply option penalties / rewards
            scienceMultiplierTotal *= opt.scienceMultiplier;
            currentPropellantKg = Math.max(0, currentPropellantKg - opt.propellantCostKg);

            // Roll for failure
            const roll = rng();
            if (roll < opt.failureChance) {
              evt.successOutcome = false;
              criticalFailures.push(`${evt.title}: Decision ${opt.label} triggered sub-system fault (Roll: ${roll.toFixed(2)})`);
            } else {
              evt.successOutcome = true;
              anomaliesResolved++;
            }
          }
        }
      }
    }

    const dayInt = Math.floor(currentDay);
    const hourInt = Math.floor((currentDay - dayInt) * 24);
    const metFormatted = `MET T+ ${String(dayInt).padStart(3, "0")}d ${String(hourInt).padStart(2, "0")}h`;

    timeline.push({
      stepIndex: step,
      tDays: currentDay,
      metFormatted,
      batterySoCPercent: Math.round(baseSoC * 10) / 10,
      solarGenerationW: currentSolarW,
      subsystemLoadW: Math.round(baseLoadW * 10) / 10,
      spacecraftTempC: currentTempC,
      propellantRemainingKg: Math.round(currentPropellantKg * 100) / 100,
      scienceBufferedGb: Math.round(currentBufferGb * 10) / 10,
      scienceDownlinkedGb: Math.round(cumulativeScienceGb * 10) / 10,
      cumulativeRadiationKrad,
      orbitAnomalyDetected: anomalyDetected,
      activeStatus,
    });
  }

  const masterStatus: SimulationResult["masterStatus"] =
    criticalFailures.length > 0 ? "critical" : anomaliesResolved < selectedEvents.length ? "degraded" : "nominal";

  const totalPossibleScience = dailyGenScienceGb * durationDays;
  const operationalEfficiency = totalPossibleScience > 0
    ? Math.min(100, Math.round((cumulativeScienceGb / totalPossibleScience) * 100))
    : 95;

  return {
    missionId: design.id,
    seed: design.seed,
    missionDurationDays: durationDays,
    totalScienceGb: Math.round(cumulativeScienceGb * 10) / 10,
    finalBatterySoC: timeline[timeline.length - 1]?.batterySoCPercent ?? 95,
    propellantRemainingKg: Math.round(currentPropellantKg * 100) / 100,
    finalRadiationKrad: cumulativeRadiationKrad,
    anomaliesEncountered: selectedEvents.length,
    anomaliesResolved,
    masterStatus,
    timeline,
    events: selectedEvents,
    criticalFailures,
    operationalEfficiencyPercent: operationalEfficiency,
  };
}
