"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import {
  runMissionSimulation,
  type SimulatorOptions,
} from "@/engine/ops/simulator";
import type {
  OperationalEvent,
  TelemetrySnapshot,
  SimulationResult,
} from "@/engine/ops/types";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatReadout } from "@/components/ui/StatReadout";
import {
  Activity,
  ArrowRight,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Bot,
  UserCheck,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Battery,
  Thermometer,
  Radio,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

export const SimulateStage: React.FC = () => {
  const { currentMission, evaluation, setOpsResult } = useMissionStore();
  const { setCurrentStage, unlockStage } = useUIStore();

  const [autopilot, setAutopilot] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(5); // 1x, 5x, 25x
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [decisionOverrides, setDecisionOverrides] = useState<Record<string, string>>({});
  const [activeAnomaly, setActiveAnomaly] = useState<OperationalEvent | null>(null);

  // Compute full simulation run with current decisions & autopilot settings
  const simResult: SimulationResult = useMemo(() => {
    const opts: SimulatorOptions = {
      durationDays: 365,
      sampleSteps: 80,
      autopilot,
      decisionOverrides,
    };
    const res = runMissionSimulation(currentMission, evaluation, opts);
    setOpsResult(res);
    return res;
  }, [currentMission, evaluation, autopilot, decisionOverrides, setOpsResult]);

  const totalSteps = simResult.timeline.length - 1;
  const currentTelemetry: TelemetrySnapshot =
    simResult.timeline[Math.min(currentStep, totalSteps)] ?? simResult.timeline[0]!;

  // Check if current step has an unresolved manual event that requires player decision
  useEffect(() => {
    if (autopilot) {
      setActiveAnomaly(null);
      return;
    }

    const currentDay = currentTelemetry.tDays;
    const pendingEvent = simResult.events.find(
      (e) => !decisionOverrides[e.id] && Math.abs(currentDay - e.triggerDay) < 6
    );

    if (pendingEvent) {
      setActiveAnomaly(pendingEvent);
      setIsPlaying(false); // Pause playback on anomaly
    } else {
      setActiveAnomaly(null);
    }
  }, [currentStep, currentTelemetry.tDays, autopilot, simResult.events, decisionOverrides]);

  // Animation frame / timer playback loop
  useEffect(() => {
    if (!isPlaying || activeAnomaly) return;

    const intervalMs = Math.max(40, 500 / speed);
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= totalSteps) {
          setIsPlaying(false);
          return totalSteps;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, totalSteps, activeAnomaly]);

  const handleSelectDecision = (eventId: string, optionId: string) => {
    setDecisionOverrides((prev) => ({ ...prev, [eventId]: optionId }));
    setActiveAnomaly(null);
    setIsPlaying(true);
  };

  const handleProceedToDebrief = () => {
    unlockStage(6);
    setCurrentStage(6);
  };

  const isCompleted = currentStep >= totalSteps;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Mission Operations Status Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-lg bg-space-panel border border-space-border">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              currentTelemetry.activeStatus === "critical"
                ? "bg-telemetry-red animate-ping"
                : currentTelemetry.activeStatus === "alert"
                ? "bg-telemetry-orange animate-pulse"
                : currentTelemetry.activeStatus === "warning"
                ? "bg-telemetry-amber"
                : "bg-telemetry-green"
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="amber" size="sm">
                STAGE 05 : MISSION CONTROL FLIGHT OPERATIONS
              </Badge>
              <Badge
                variant={
                  currentTelemetry.activeStatus === "nominal"
                    ? "nominal"
                    : currentTelemetry.activeStatus === "warning"
                    ? "warning"
                    : "alert"
                }
                size="sm"
              >
                {currentTelemetry.activeStatus.toUpperCase()}
              </Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-heading uppercase tracking-widest text-white font-bold mt-0.5">
              {currentMission.name} &bull; On-Orbit Flight Operations
            </h1>
          </div>
        </div>

        {/* MET Clock & Autopilot Switch */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-2 rounded bg-space-950 border border-space-border text-center">
            <span className="text-[10px] text-slate-500 uppercase block">Mission Elapsed Time</span>
            <span className="text-base font-bold text-telemetry-amber">
              {currentTelemetry.metFormatted}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setAutopilot((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded border transition-colors font-mono text-xs uppercase ${
              autopilot
                ? "bg-telemetry-cyan/20 border-telemetry-cyan text-telemetry-cyan font-bold"
                : "bg-space-950 border-space-border text-slate-400 hover:text-white"
            }`}
            title="Toggle between NASA SOP automated resolution and manual Flight Director decisions"
          >
            {autopilot ? <Bot className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            <span>{autopilot ? "CAPCOM Autopilot (SOP)" : "Manual Flight Director"}</span>
          </button>
        </div>
      </div>

      {/* 2. Playback Controls & Scrubber */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-space-panel/90 border border-space-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPlaying((p) => !p)}
          disabled={isCompleted && !isPlaying}
          className="flex items-center gap-1.5"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? "Pause" : "Resume"}</span>
        </Button>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-space-950 p-1 rounded border border-space-border text-xs font-mono">
          {[1, 5, 25].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => setSpeed(spd)}
              className={`px-2 py-0.5 rounded transition-colors ${
                speed === spd
                  ? "bg-telemetry-amber text-space-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Scrubber slider */}
        <div className="flex-1 flex items-center gap-2 mx-2">
          <input
            type="range"
            min={0}
            max={totalSteps}
            value={currentStep}
            onChange={(e) => {
              setCurrentStep(Number(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full accent-telemetry-amber cursor-pointer h-1.5 bg-space-950 rounded-lg"
          />
          <span className="font-mono text-xs text-slate-400 w-16 text-right">
            {((currentStep / totalSteps) * 100).toFixed(0)}%
          </span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setCurrentStep(totalSteps);
            setIsPlaying(false);
          }}
          className="flex items-center gap-1"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>Fast-Forward</span>
        </Button>
      </div>

      {/* 3. Live Subsystem Telemetry Readout Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatReadout
          label={
            <span className="flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 text-telemetry-green" />
              <span>Battery SoC</span>
            </span>
          }
          value={currentTelemetry.batterySoCPercent.toFixed(1)}
          unit="%"
          size="sm"
          status={currentTelemetry.batterySoCPercent < 50 ? "alert" : "nominal"}
        />

        <StatReadout
          label={
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-telemetry-amber" />
              <span>Solar Power</span>
            </span>
          }
          value={currentTelemetry.solarGenerationW.toFixed(0)}
          unit="W"
          size="sm"
          status="nominal"
        />

        <StatReadout
          label={
            <span className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-telemetry-cyan" />
              <span>Temperature</span>
            </span>
          }
          value={currentTelemetry.spacecraftTempC.toFixed(1)}
          unit="°C"
          size="sm"
          status="nominal"
        />

        <StatReadout
          label={
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-telemetry-orange" />
              <span>Propellant</span>
            </span>
          }
          value={currentTelemetry.propellantRemainingKg.toFixed(1)}
          unit="kg"
          size="sm"
          status={currentTelemetry.propellantRemainingKg < 5 ? "alert" : "nominal"}
        />

        <StatReadout
          label={
            <span className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-telemetry-cyan" />
              <span>Science Buffer</span>
            </span>
          }
          value={currentTelemetry.scienceBufferedGb.toFixed(1)}
          unit="GB"
          size="sm"
          status="nominal"
        />

        <StatReadout
          label={
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-telemetry-green" />
              <span>Total Downlink</span>
            </span>
          }
          value={currentTelemetry.scienceDownlinkedGb.toFixed(1)}
          unit="GB"
          size="sm"
          status="nominal"
        />
      </div>

      {/* 4. Split Ops Console: Chronological Flight Log + Telemetry Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Chronological Flight Director Log */}
        <Panel
          title={
            <span className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4 text-telemetry-cyan" />
              <span>Chronological Flight Director Event Log</span>
            </span>
          }
          bodyClassName="p-4 flex flex-col gap-2 max-h-72 overflow-y-auto font-mono text-xs"
        >
          <div className="flex items-center gap-2 text-slate-400 border-b border-space-border/50 pb-1.5">
            <span className="text-telemetry-cyan">T+ 000d 00h</span>
            <span>Spacecraft orbital insertion confirmed. Solar arrays deployed and attitude stabilized.</span>
          </div>

          {simResult.events.map((evt) => {
            const hasOccurred = currentTelemetry.tDays >= evt.triggerDay;
            if (!hasOccurred) return null;

            return (
              <div
                key={evt.id}
                className={`p-2.5 rounded border flex flex-col gap-1 transition-all ${
                  evt.successOutcome === false
                    ? "bg-telemetry-red/10 border-telemetry-red/50 text-red-200"
                    : "bg-space-950/80 border-space-border text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-telemetry-amber font-bold">
                    T+ {String(evt.triggerDay).padStart(3, "0")}d 00h
                  </span>
                  <Badge variant={evt.successOutcome === false ? "alert" : "nominal"} size="sm">
                    {evt.category.toUpperCase()}
                  </Badge>
                </div>
                <h4 className="font-heading font-semibold text-white uppercase text-xs">
                  {evt.title}
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {evt.resolutionLog ?? evt.description}
                </p>
              </div>
            );
          })}

          {isCompleted && (
            <div className="p-2 rounded bg-telemetry-green/10 border border-telemetry-green/50 text-telemetry-green flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Full operational mission timeline complete. All primary flight objectives fulfilled.</span>
            </div>
          )}
        </Panel>

        {/* Right: Subsystem Health & Diagnostics Matrix */}
        <Panel
          title={
            <span className="flex items-center gap-2 text-white">
              <Activity className="w-4 h-4 text-telemetry-green" />
              <span>Subsystem Health & Degradation Diagnostics</span>
            </span>
          }
          bodyClassName="p-4 flex flex-col gap-3 font-mono text-xs"
        >
          {/* Solar Degradation */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Photovoltaic Solar Array Efficiency</span>
              <span className="text-white font-bold">
                {((currentTelemetry.solarGenerationW / evaluation.power.orbitAverageGenerationW) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-space-950 h-2 rounded overflow-hidden border border-space-border">
              <div
                className="bg-telemetry-amber h-full transition-all duration-300"
                style={{
                  width: `${(currentTelemetry.solarGenerationW / evaluation.power.orbitAverageGenerationW) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Propellant Tank Level */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>RCS / Delta-V Propellant Tank Reserve</span>
              <span className="text-white font-bold">
                {currentMission.propellantMassKg > 0
                  ? ((currentTelemetry.propellantRemainingKg / currentMission.propellantMassKg) * 100).toFixed(1)
                  : "0"}%
              </span>
            </div>
            <div className="w-full bg-space-950 h-2 rounded overflow-hidden border border-space-border">
              <div
                className="bg-telemetry-orange h-full transition-all duration-300"
                style={{
                  width: `${currentMission.propellantMassKg > 0 ? (currentTelemetry.propellantRemainingKg / currentMission.propellantMassKg) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Radiation Accumulation */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Cumulative Radiation Dose (TID)</span>
              <span className="text-white font-bold">
                {currentTelemetry.cumulativeRadiationKrad.toFixed(2)} krad
              </span>
            </div>
            <div className="w-full bg-space-950 h-2 rounded overflow-hidden border border-space-border">
              <div
                className="bg-telemetry-cyan h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (currentTelemetry.cumulativeRadiationKrad / 25) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Operational Efficiency summary */}
          <div className="p-3 rounded bg-space-950 border border-space-border flex items-center justify-between mt-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Operations Efficiency</span>
              <span className="text-sm font-bold text-telemetry-green">
                {simResult.operationalEfficiencyPercent}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block">Anomalies Handled</span>
              <span className="text-sm font-bold text-white">
                {simResult.anomaliesResolved} / {simResult.anomaliesEncountered}
              </span>
            </div>
          </div>
        </Panel>
      </div>

      {/* 5. Interactive Anomaly Decision Modal */}
      {activeAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-xl w-full p-6 rounded-lg border border-telemetry-amber bg-space-panel shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-telemetry-amber/20 border border-telemetry-amber flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-telemetry-amber animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="alert">ANOMALY DETECTED</Badge>
                  <span className="font-mono text-xs text-telemetry-amber">
                    T+ {String(activeAnomaly.triggerDay).padStart(3, "0")}d
                  </span>
                </div>
                <h3 className="font-heading uppercase text-xl font-bold text-white tracking-wide">
                  {activeAnomaly.title}
                </h3>
              </div>
            </div>

            <p className="text-xs font-mono text-slate-300 leading-relaxed bg-space-950 p-3 rounded border border-space-border">
              {activeAnomaly.description}
            </p>

            <div className="flex flex-col gap-2.5">
              <span className="font-heading uppercase text-xs tracking-wider text-slate-400 font-bold">
                Select Flight Director Command Action:
              </span>

              {activeAnomaly.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectDecision(activeAnomaly.id, opt.id)}
                  className="p-3.5 rounded border border-space-border bg-space-bg hover:border-telemetry-amber hover:bg-space-panel-elevated transition-all text-left flex flex-col gap-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading uppercase text-sm font-bold text-white group-hover:text-telemetry-amber transition-colors">
                      {opt.label}
                    </span>
                    {opt.nasaSopRecommended && (
                      <Badge variant="nominal" size="sm">
                        NASA SOP RECOMMENDED
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-slate-300">
                    {opt.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-space-border/40">
                    <span>Fuel: -{opt.propellantCostKg} kg</span>
                    <span>Science: {(opt.scienceMultiplier * 100).toFixed(0)}%</span>
                    <span>Risk: {(opt.failureChance * 100).toFixed(0)}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Mission Operations Completion Card */}
      {isCompleted && (
        <div className="p-6 rounded-lg bg-gradient-to-r from-telemetry-green/15 to-telemetry-cyan/15 border border-telemetry-green/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-telemetry-green/20 border-2 border-telemetry-green flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-telemetry-green" />
            </div>
            <div>
              <h3 className="font-heading uppercase text-xl font-bold text-white tracking-wide">
                Mission Operations Completed Nominal
              </h3>
              <p className="text-xs font-mono text-slate-300">
                Gathered {simResult.totalScienceGb} GB scientific data. Resolved {simResult.anomaliesResolved} on-orbit anomalies. Spacecraft ready for mission evaluation.
              </p>
            </div>
          </div>

          <Button
            size="lg"
            variant="primary"
            onClick={handleProceedToDebrief}
            className="flex items-center gap-2 px-6 shadow-glow-amber whitespace-nowrap"
          >
            <span>PROCEED TO MISSION DEBRIEF</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
