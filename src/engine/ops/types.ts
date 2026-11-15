/**
 * MoonLander Operations Simulation Types
 * Pure TypeScript definitions for time-stepped subsystem telemetry and flight anomalies.
 */

export interface TelemetrySnapshot {
  stepIndex: number;
  tDays: number;
  metFormatted: string; // "MET T+ 042d 14h"
  batterySoCPercent: number; // 0 - 100%
  solarGenerationW: number;
  subsystemLoadW: number;
  spacecraftTempC: number;
  propellantRemainingKg: number;
  scienceBufferedGb: number;
  scienceDownlinkedGb: number;
  cumulativeRadiationKrad: number;
  orbitAnomalyDetected: boolean;
  activeStatus: "nominal" | "warning" | "alert" | "critical";
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  riskDescription: string;
  nasaSopRecommended?: boolean;
  scienceMultiplier: number; // 0.0 - 1.5
  propellantCostKg: number;
  batteryDrainPercent: number;
  failureChance: number; // 0.0 - 1.0
  outcomeMessage: string;
}

export interface OperationalEvent {
  id: string;
  title: string;
  description: string;
  triggerDay: number;
  category: "solar-storm" | "seu" | "reaction-wheel" | "thermal" | "debris" | "ground-loss";
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
  selectedOptionId?: string;
  options: DecisionOption[];
  resolutionLog?: string;
  successOutcome?: boolean;
}

export interface SimulationResult {
  missionId: string;
  seed: string;
  missionDurationDays: number;
  totalScienceGb: number;
  finalBatterySoC: number;
  propellantRemainingKg: number;
  finalRadiationKrad: number;
  anomaliesEncountered: number;
  anomaliesResolved: number;
  masterStatus: "nominal" | "degraded" | "critical";
  timeline: TelemetrySnapshot[];
  events: OperationalEvent[];
  criticalFailures: string[];
  operationalEfficiencyPercent: number;
}
