"use client";

import React from "react";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatReadout } from "@/components/ui/StatReadout";
import {
  Activity,
  ArrowRight,
  Globe2,
  Zap,
  Radio,
  Clock,
  Sparkles,
} from "lucide-react";

export const SimulateStage: React.FC = () => {
  const { currentMission, evaluation } = useMissionStore();
  const { setCurrentStage, unlockStage } = useUIStore();

  const handleProceed = () => {
    unlockStage(6);
    setCurrentStage(6);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-1 border-b border-space-border pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="amber" size="sm">
            STAGE 05 : ON-ORBIT OPERATIONS
          </Badge>
          <Badge variant="info" size="sm">
            STAGE 2 PREVIEW
          </Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-heading uppercase tracking-widest text-white font-bold">
          Live Spacecraft Orbital Simulation
        </h1>
        <p className="text-xs font-mono text-gray-400">
          Real-time orbital tracking, power cycling, science data collection, and ground pass telemetry.
        </p>
      </div>

      {/* Stage 2 Unlocks Banner */}
      <div className="p-4 rounded border border-telemetry-cyan/40 bg-telemetry-cyan/5 backdrop-blur-md flex flex-col gap-2">
        <div className="flex items-center gap-2 text-telemetry-cyan font-heading uppercase tracking-wider font-bold text-sm">
          <Sparkles className="w-4 h-4 text-telemetry-cyan" />
          <span>Interactive Operations Engine (Unlocks in Stage 2)</span>
        </div>
        <p className="text-xs font-mono text-gray-300 leading-relaxed">
          Stage 2 will introduce live 3D orbital propagation, real solar weather events stream via NASA DONKI API, random space debris encounters, causal debrief engines, and real ephemerides. The foundational metrics below are fully evaluated and active:
        </p>
      </div>

      {/* Live Operations Telemetry Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatReadout
          label="Perigee Velocity"
          value={evaluation.orbit.velocityPerigeeKmS}
          unit="km/s"
          size="md"
          status="info"
        />
        <StatReadout
          label="Orbital Period"
          value={(evaluation.orbit.periodSeconds / 60).toFixed(1)}
          unit="min"
          size="md"
          status="nominal"
        />
        <StatReadout
          label="Power Generation"
          value={evaluation.power.orbitAverageGenerationW.toFixed(0)}
          unit="W"
          size="md"
          status="nominal"
        />
        <StatReadout
          label="Data Generated"
          value={evaluation.comms.dataGeneratedGbPerDay.toFixed(1)}
          unit="GB/day"
          size="md"
          status="nominal"
        />
      </div>

      {/* Ground Station Pass & Subsystem Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel
          title={
            <span className="flex items-center gap-2 text-gray-200">
              <Globe2 className="w-4 h-4 text-telemetry-cyan" />
              <span>Ground Station Pass Geometry</span>
            </span>
          }
          bodyClassName="p-4 flex flex-col gap-2.5 text-xs font-mono"
        >
          <div className="flex justify-between py-1 border-b border-space-border/50">
            <span className="text-gray-400">Earth Central Half-Angle:</span>
            <span className="text-gray-100 font-bold">17.4°</span>
          </div>
          <div className="flex justify-between py-1 border-b border-space-border/50">
            <span className="text-gray-400">Mean Pass Duration:</span>
            <span className="text-gray-100 font-bold">
              ~6.1 minutes per pass
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-space-border/50">
            <span className="text-gray-400">Daily Contact Time:</span>
            <span className="text-telemetry-green font-bold">
              {evaluation.comms.dailyContactMinutes.toFixed(0)} minutes/day
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-400">Downlink Throughput:</span>
            <span className="text-telemetry-cyan font-bold">
              {evaluation.comms.downlinkCapacityGbPerDay.toFixed(1)} GB/day
            </span>
          </div>
        </Panel>

        <Panel
          title={
            <span className="flex items-center gap-2 text-gray-200">
              <Activity className="w-4 h-4 text-telemetry-amber" />
              <span>Subsystem Health & Degradation</span>
            </span>
          }
          bodyClassName="p-4 flex flex-col gap-2.5 text-xs font-mono"
        >
          <div className="flex justify-between py-1 border-b border-space-border/50">
            <span className="text-gray-400">Battery Eclipse Cycles:</span>
            <span className="text-gray-100 font-bold">
              {evaluation.power.annualCycles.toLocaleString()} cycles/yr
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-space-border/50">
            <span className="text-gray-400">Accumulated TID Dose:</span>
            <span className="text-gray-100 font-bold">
              {evaluation.radiation.totalMissionDoseKrad.toFixed(1)} krad
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-space-border/50">
            <span className="text-gray-400">Delta-V Remaining:</span>
            <span className="text-telemetry-green font-bold">
              {evaluation.propulsion.deltaVAvailableMs} m/s
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-400">Mission Limiter:</span>
            <Badge variant="nominal" size="sm">
              {evaluation.lifetime.limiter.toUpperCase()}
            </Badge>
          </div>
        </Panel>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          variant="primary"
          onClick={handleProceed}
          className="flex items-center gap-2"
        >
          <span>Review Final Scientific Debrief</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

