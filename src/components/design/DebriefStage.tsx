"use client";

import React from "react";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import {
  Award,
  RotateCcw,
  PlusCircle,
  Download,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export const DebriefStage: React.FC = () => {
  const { currentMission, evaluation, exportMissionJson } = useMissionStore();
  const { setCurrentStage } = useUIStore();

  const { science, cost, schedule, launchOutcome } = evaluation;

  const gradeColors = {
    S: "text-telemetry-amber border-telemetry-amber shadow-glow-amber",
    A: "text-telemetry-green border-telemetry-green shadow-glow-green",
    B: "text-telemetry-cyan border-telemetry-cyan shadow-glow-cyan",
    C: "text-telemetry-orange border-telemetry-orange",
    F: "text-telemetry-red border-telemetry-red shadow-glow-red",
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-1 border-b border-space-border pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="amber" size="sm">
            STAGE 06 : MISSION EVALUATION & DEBRIEF
          </Badge>
          <Badge variant={launchOutcome.success ? "nominal" : "alert"} size="sm">
            {launchOutcome.success ? "MISSION SUCCESSFUL" : "MISSION ANOMALY"}
          </Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-heading uppercase tracking-widest text-white font-bold">
          Post-Flight Scientific Evaluation & Performance Audit
        </h1>
        <p className="text-xs font-mono text-gray-400">
          Causal analysis of payload performance, orbital observation efficiency, and project lifecycle execution.
        </p>
      </div>

      {/* Grade and Score Card */}
      <div className="p-6 rounded border border-space-border bg-space-panel flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div
            className={`w-24 h-24 rounded-full border-2 flex items-center justify-center font-heading text-6xl font-bold ${gradeColors[science.grade]}`}
          >
            {science.grade}
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-heading uppercase tracking-widest text-gray-400">
              Composite Science Return
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-white">
                {science.totalScienceScore}
              </span>
              <span className="text-sm font-mono text-gray-400">
                / {science.maxPossibleScore} Points ({science.percentageScore}%)
              </span>
            </div>
            <span className="text-xs font-mono text-telemetry-cyan mt-1">
              {science.requirementsSummary.allRequirementsMet
                ? "All mission level objectives and science thresholds achieved."
                : `${science.requirementsSummary.metRequirements} of ${science.requirementsSummary.totalRequirements} formal requirements fulfilled.`}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto text-xs font-mono text-gray-300">
          <div className="flex justify-between md:justify-end gap-4">
            <span className="text-gray-400">Budget Performance:</span>
            <span className={cost.withinBudget ? "text-telemetry-green" : "text-telemetry-red font-bold"}>
              ${cost.totalMissionCostM.toFixed(1)}M / ${cost.budgetCapM.toFixed(1)}M
            </span>
          </div>
          <div className="flex justify-between md:justify-end gap-4">
            <span className="text-gray-400">Schedule Delivery:</span>
            <span className={schedule.withinDeadline ? "text-telemetry-green" : "text-telemetry-red font-bold"}>
              {schedule.totalScheduleMonths} mo / {schedule.deadlineMonths} mo
            </span>
          </div>
          <div className="flex justify-between md:justify-end gap-4">
            <span className="text-gray-400">Launch Reliability:</span>
            <span className="text-telemetry-cyan font-bold">
              {(launchOutcome.probability * 100).toFixed(1)}% ({launchOutcome.roll <= launchOutcome.probability ? "Successful" : "Failed"})
            </span>
          </div>
        </div>
      </div>

      {/* Per-Instrument Scientific Score Breakdown */}
      <Panel
        title={
          <span className="flex items-center gap-2 text-gray-200">
            <Award className="w-4 h-4 text-telemetry-amber" />
            <span>Payload Sensor Performance Breakdown</span>
          </span>
        }
        bodyClassName="p-0 overflow-x-auto"
      >
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-space-border bg-black/40 text-[11px] font-heading uppercase tracking-wider text-gray-400">
              <th className="p-3">Instrument</th>
              <th className="p-3">Base</th>
              <th className="p-3">Orbit Fit</th>
              <th className="p-3">Data Return</th>
              <th className="p-3">Lifetime Factor</th>
              <th className="p-3 text-right">Yield</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-space-border/50">
            {science.instrumentBreakdown.map((item) => (
              <tr key={item.instrumentId} className="hover:bg-white/5 transition-colors">
                <td className="p-3">
                  <div className="font-heading uppercase text-gray-200 font-bold">
                    {item.instrumentName}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                    {item.orbitFitReason}
                  </div>
                </td>
                <td className="p-3 text-gray-300">{item.baseValue}</td>
                <td className="p-3 text-telemetry-cyan">{(item.orbitFitFactor * 100).toFixed(0)}%</td>
                <td className="p-3 text-telemetry-green">{(item.dataReturnFraction * 100).toFixed(0)}%</td>
                <td className="p-3 text-gray-300">{item.lifetimeFactor.toFixed(2)}</td>
                <td className="p-3 text-right font-bold text-telemetry-amber text-sm">
                  {item.finalScore} pts
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          size="md"
          variant="outline"
          onClick={() => setCurrentStage(3)}
          className="flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Iterate Spacecraft Design</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            size="md"
            variant="secondary"
            onClick={() => {
              const report = exportMissionJson();
              const blob = new Blob([report], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${currentMission.name.toLowerCase().replace(/\s+/g, "-")}-report.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Report JSON</span>
          </Button>

          <Link href="/mission/new">
            <Button size="md" variant="primary" className="flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>Launch New Mission</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

