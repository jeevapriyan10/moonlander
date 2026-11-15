"use client";

import React from "react";
import { useMissionStore } from "@/store/mission";
import { Panel } from "@/components/ui/Panel";
import { Gauge } from "@/components/ui/Gauge";
import { StatReadout } from "@/components/ui/StatReadout";
import { Badge } from "@/components/ui/Badge";
import { Explain } from "@/components/ui/Explain";
import {
  Weight,
  Zap,
  DollarSign,
  Radio,
  Clock,
  AlertTriangle,
  Hourglass,
  HardDrive,
} from "lucide-react";

export interface DashboardProps {
  className?: string;
  onProceedToOrbit?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ className, onProceedToOrbit }) => {
  const { evaluation, currentMission } = useMissionStore();

  const {
    mass,
    power,
    cost,
    comms,
    schedule,
    risk,
    lifetime,
    science,
  } = evaluation;

  return (
    <div className={`flex flex-col gap-2.5 overflow-y-auto no-scrollbar ${className ?? ""}`}>
      {/* 1. Mass & Launch Lift */}
      <Panel
        title={
          <span className="flex items-center gap-1.5 text-gray-200">
            <Weight className="w-4 h-4 text-telemetry-amber" />
            <span>Mass Telemetry</span>
          </span>
        }
        subtitle={`Dry: ${mass.totalDryMassKg.toFixed(1)} kg | Wet: ${mass.totalWetMassKg.toFixed(1)} kg`}
        bodyClassName="flex flex-col gap-2 p-2.5"
      >
        <Gauge
          label="Bus Dry Mass Limit"
          value={mass.totalDryMassKg}
          max={evaluation.mass.busDryMassKg > 0 ? evaluation.validation.find(v => v.id === "mass-bus-exceeded") ? mass.totalDryMassKg * 1.1 : mass.totalDryMassKg * 1.2 : 1000}
          unit="kg"
          warningThreshold={mass.totalDryMassKg * 0.85}
          alertThreshold={mass.totalDryMassKg * 0.98}
        />

        <div className="grid grid-cols-2 gap-1.5">
          <StatReadout
            label="Payload"
            value={mass.payloadMassKg.toFixed(1)}
            unit="kg"
            size="sm"
          />
          <StatReadout
            label={<Explain id="mass-margin">Growth Margin</Explain>}
            value={`+${mass.growthMarginPercent}%`}
            unit="AIAA"
            subtext={`${mass.growthMarginKg.toFixed(1)} kg`}
            size="sm"
            status="info"
          />
        </div>
      </Panel>

      {/* 2. Electrical Power & Energy */}
      <Panel
        title={
          <span className="flex items-center gap-1.5 text-gray-200">
            <Zap className="w-4 h-4 text-telemetry-amber" />
            <span>Power & Battery</span>
          </span>
        }
        subtitle={`Generation: ${power.orbitAverageGenerationW.toFixed(0)}W | Load: ${power.totalLoadW.toFixed(0)}W`}
        bodyClassName="flex flex-col gap-2 p-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <Gauge
            variant="arc"
            label={<Explain id="power-margin">Power Margin</Explain>}
            value={power.powerMarginPercent}
            min={-20}
            max={80}
            unit="%"
            warningThreshold={15}
            alertThreshold={5}
            invertSeverity={true}
            className="flex-1"
          />
          <div className="flex flex-col gap-1.5 flex-1">
            <StatReadout
              label={<Explain id="eclipse-fraction">Eclipse Pass</Explain>}
              value={(power.eclipseDurationSeconds / 60).toFixed(0)}
              unit="min"
              size="sm"
              subtext={`${(evaluation.orbit.eclipseFraction * 100).toFixed(0)}% of orbit`}
            />
            <StatReadout
              label={<Explain id="depth-of-discharge">Battery DoD</Explain>}
              value={(power.depthOfDischargeUsed * 100).toFixed(0)}
              unit="%"
              size="sm"
              status={power.depthOfDischargeUsed <= 0.35 ? "nominal" : "warning"}
            />
          </div>
        </div>

        <Gauge
          label={<Explain id="li-ion-battery">Battery Capacity Storage</Explain>}
          value={power.batteryCapacityWhInstalled}
          max={Math.max(power.batteryCapacityWhInstalled, power.batteryCapacityWhRequired) * 1.25}
          unit="Wh"
          warningThreshold={power.batteryCapacityWhRequired}
          alertThreshold={power.batteryCapacityWhRequired * 0.95}
          invertSeverity={true}
        />
      </Panel>

      {/* 3. Budget & Schedule */}
      <Panel
        title={
          <span className="flex items-center gap-1.5 text-gray-200">
            <DollarSign className="w-4 h-4 text-telemetry-amber" />
            <span>Lifecycle Economics</span>
          </span>
        }
        subtitle={`Cost: $${cost.totalMissionCostM.toFixed(1)}M | Cap: $${cost.budgetCapM.toFixed(1)}M`}
        bodyClassName="flex flex-col gap-2 p-2.5"
      >
        <Gauge
          label="Budget Allocation"
          value={cost.totalMissionCostM}
          max={cost.budgetCapM}
          unit="$M"
          warningThreshold={cost.budgetCapM * 0.85}
          alertThreshold={cost.budgetCapM * 0.98}
        />

        <div className="grid grid-cols-2 gap-1.5">
          <StatReadout
            label="Variance"
            value={cost.budgetVarianceM >= 0 ? `+$${cost.budgetVarianceM.toFixed(1)}` : `-$${Math.abs(cost.budgetVarianceM).toFixed(1)}`}
            unit="M"
            size="sm"
            status={cost.budgetVarianceM >= 0 ? "nominal" : "alert"}
          />
          <StatReadout
            label="Schedule"
            value={schedule.totalScheduleMonths}
            unit="mo"
            limit={`${schedule.deadlineMonths} mo`}
            size="sm"
            status={schedule.withinDeadline ? "nominal" : "alert"}
          />
        </div>
      </Panel>

      {/* 4. Science Data & Telecommunications */}
      <Panel
        title={
          <span className="flex items-center gap-1.5 text-gray-200">
            <Radio className="w-4 h-4 text-telemetry-cyan" />
            <span>Comms & Data Flow</span>
          </span>
        }
        subtitle={`Generated: ${comms.dataGeneratedGbPerDay.toFixed(1)} GB/day | Downlink: ${comms.downlinkCapacityGbPerDay.toFixed(1)} GB/day`}
        bodyClassName="flex flex-col gap-2 p-2.5"
      >
        <div className="grid grid-cols-2 gap-1.5">
          <StatReadout
            label={<Explain id="ground-station-pass">Return Fraction</Explain>}
            value={`${(comms.dataReturnFraction * 100).toFixed(0)}%`}
            size="sm"
            status={comms.dataReturnFraction >= 0.9 ? "nominal" : "warning"}
          />
          <StatReadout
            label={<Explain id="buffer-overflow">Storage Buffer</Explain>}
            value={comms.storageBufferDays.toFixed(1)}
            unit="days"
            size="sm"
            status={comms.storageBufferDays >= 1.5 ? "nominal" : "warning"}
          />
        </div>
      </Panel>

      {/* 5. System Risk & Mission Lifetime */}
      <Panel
        title={
          <span className="flex items-center gap-1.5 text-gray-200">
            <AlertTriangle className="w-4 h-4 text-telemetry-orange" />
            <span>System Risk & Durability</span>
          </span>
        }
        subtitle={`Risk: ${risk.score}/100 (${risk.riskRating}) | Projected: ${lifetime.projectedLifetimeYears} yr`}
        bodyClassName="flex flex-col gap-2 p-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <Gauge
            variant="arc"
            label={<Explain id="fdir">Mission Risk</Explain>}
            value={risk.score}
            min={0}
            max={100}
            unit="/100"
            warningThreshold={35}
            alertThreshold={60}
            className="flex-1"
          />

          <div className="flex flex-col gap-1.5 flex-1">
            <div className="p-2 rounded bg-black/30 border border-space-border/60 flex flex-col gap-1">
              <span className="text-[10px] font-heading uppercase text-gray-400">
                Primary Limiter
              </span>
              <Badge
                variant={lifetime.limiter === "design-target" ? "nominal" : "warning"}
                size="sm"
                className="truncate"
              >
                {lifetime.limiter.toUpperCase()}
              </Badge>
              <span className="text-[9px] font-mono text-gray-500 leading-tight">
                {lifetime.limiterDescription}
              </span>
            </div>
          </div>
        </div>
      </Panel>

      {/* 6. Launch & Flight Certification Action */}
      {onProceedToOrbit && (
        <div className="pt-1 pb-2">
          <button
            type="button"
            onClick={onProceedToOrbit}
            className="w-full py-2.5 px-4 rounded bg-telemetry-amber text-space-950 font-heading font-bold text-xs uppercase tracking-wider hover:bg-telemetry-amber/90 transition-colors shadow-glow-amber flex items-center justify-center gap-2"
          >
            <span>Proceed to Orbit & Launch</span>
            <span className="font-mono text-xs">→</span>
          </button>
        </div>
      )}
    </div>
  );
};

