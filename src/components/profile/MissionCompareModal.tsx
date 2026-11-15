"use client";

import React from "react";
import type { MissionHistoryRecord } from "@/lib/repository/types";
import { Badge } from "@/components/ui/Badge";
import { X, Trophy, CheckCircle2, XCircle } from "lucide-react";

interface MissionCompareModalProps {
  missionA: MissionHistoryRecord;
  missionB: MissionHistoryRecord;
  onClose: () => void;
}

export const MissionCompareModal: React.FC<MissionCompareModalProps> = ({
  missionA,
  missionB,
  onClose,
}) => {
  const scoreDiff = missionA.score - missionB.score;
  const costDiff = missionA.costM - missionB.costM;
  const massDiff = missionA.massKg - missionB.massKg;
  const deltaVDiff = missionA.deltaVKmS - missionB.deltaVKmS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-space-bg border border-space-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-space-border bg-space-surface/50">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-telemetry-amber" />
            <h2 className="font-heading uppercase text-sm tracking-wider font-bold text-white">
              Comparative Mission Analysis
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Header Row: Mission Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Mission A */}
            <div className="p-4 rounded-lg bg-space-surface border border-space-border/60">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={missionA.success ? "nominal" : "alert"} size="sm">
                  {missionA.success ? "MISSION SUCCESS" : "MISSION FAILED"}
                </Badge>
                <span className="font-mono text-xs text-gray-400">
                  {new Date(missionA.completedAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-heading uppercase font-bold text-lg text-white truncate">
                {missionA.missionName}
              </h3>
              <p className="font-mono text-xs text-telemetry-cyan uppercase mb-3">
                {missionA.scenarioId} &bull; {missionA.seed}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-extrabold text-white">
                  {missionA.score}
                </span>
                <span className="text-xs text-gray-400 font-mono">/ 100 PTS</span>
                <Badge variant={missionA.grade === "S" ? "amber" : missionA.grade === "A" ? "nominal" : "warning"}>
                  GRADE {missionA.grade}
                </Badge>
              </div>
            </div>

            {/* Mission B */}
            <div className="p-4 rounded-lg bg-space-surface border border-space-border/60">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={missionB.success ? "nominal" : "alert"} size="sm">
                  {missionB.success ? "MISSION SUCCESS" : "MISSION FAILED"}
                </Badge>
                <span className="font-mono text-xs text-gray-400">
                  {new Date(missionB.completedAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-heading uppercase font-bold text-lg text-white truncate">
                {missionB.missionName}
              </h3>
              <p className="font-mono text-xs text-telemetry-cyan uppercase mb-3">
                {missionB.scenarioId} &bull; {missionB.seed}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-extrabold text-white">
                  {missionB.score}
                </span>
                <span className="text-xs text-gray-400 font-mono">/ 100 PTS</span>
                <Badge variant={missionB.grade === "S" ? "amber" : missionB.grade === "A" ? "nominal" : "warning"}>
                  GRADE {missionB.grade}
                </Badge>
              </div>
            </div>
          </div>

          {/* Metric Comparison Table */}
          <div className="border border-space-border rounded-lg overflow-hidden font-mono text-xs">
            <div className="grid grid-cols-3 bg-black/40 p-3 font-heading uppercase text-gray-400 tracking-wider border-b border-space-border text-center">
              <div>Mission A</div>
              <div>Telemetry Parameter</div>
              <div>Mission B</div>
            </div>

            {/* Score Delta */}
            <div className="grid grid-cols-3 p-3 items-center border-b border-space-border/40 hover:bg-white/5">
              <div className="text-center font-bold text-white text-sm">
                {missionA.score}
                {scoreDiff > 0 && <span className="text-telemetry-green ml-1.5">(+{scoreDiff})</span>}
              </div>
              <div className="text-center font-sans text-gray-300 font-medium">Composite Flight Score</div>
              <div className="text-center font-bold text-white text-sm">
                {missionB.score}
                {scoreDiff < 0 && <span className="text-telemetry-green ml-1.5">(+{-scoreDiff})</span>}
              </div>
            </div>

            {/* Cost Delta */}
            <div className="grid grid-cols-3 p-3 items-center border-b border-space-border/40 hover:bg-white/5">
              <div className="text-center text-white">
                ${missionA.costM.toFixed(1)}M
                {costDiff < 0 && <span className="text-telemetry-green ml-1.5">(-${(-costDiff).toFixed(1)}M)</span>}
              </div>
              <div className="text-center font-sans text-gray-300 font-medium">Total Lifecycle Budget</div>
              <div className="text-center text-white">
                ${missionB.costM.toFixed(1)}M
                {costDiff > 0 && <span className="text-telemetry-green ml-1.5">(-${costDiff.toFixed(1)}M)</span>}
              </div>
            </div>

            {/* Mass Delta */}
            <div className="grid grid-cols-3 p-3 items-center border-b border-space-border/40 hover:bg-white/5">
              <div className="text-center text-white">
                {missionA.massKg.toFixed(1)} kg
                {massDiff < 0 && <span className="text-telemetry-green ml-1.5">(-{(-massDiff).toFixed(1)} kg)</span>}
              </div>
              <div className="text-center font-sans text-gray-300 font-medium">Wet Launch Mass</div>
              <div className="text-center text-white">
                {missionB.massKg.toFixed(1)} kg
                {massDiff > 0 && <span className="text-telemetry-green ml-1.5">(-{massDiff.toFixed(1)} kg)</span>}
              </div>
            </div>

            {/* Delta-V */}
            <div className="grid grid-cols-3 p-3 items-center border-b border-space-border/40 hover:bg-white/5">
              <div className="text-center text-white">
                {missionA.deltaVKmS.toFixed(2)} km/s
                {deltaVDiff > 0 && <span className="text-telemetry-cyan ml-1.5">(+{deltaVDiff.toFixed(2)})</span>}
              </div>
              <div className="text-center font-sans text-gray-300 font-medium">Propulsion Delta-V</div>
              <div className="text-center text-white">
                {missionB.deltaVKmS.toFixed(2)} km/s
                {deltaVDiff < 0 && <span className="text-telemetry-cyan ml-1.5">(+{(-deltaVDiff).toFixed(2)})</span>}
              </div>
            </div>

            {/* Target Orbit */}
            <div className="grid grid-cols-3 p-3 items-center border-b border-space-border/40 hover:bg-white/5">
              <div className="text-center text-telemetry-amber uppercase">{missionA.orbitId}</div>
              <div className="text-center font-sans text-gray-300 font-medium">Selected Orbit</div>
              <div className="text-center text-telemetry-amber uppercase">{missionB.orbitId}</div>
            </div>

            {/* Launcher */}
            <div className="grid grid-cols-3 p-3 items-center hover:bg-white/5">
              <div className="text-center text-gray-200 uppercase">{missionA.launcherId}</div>
              <div className="text-center font-sans text-gray-300 font-medium">Launch Vehicle</div>
              <div className="text-center text-gray-200 uppercase">{missionB.launcherId}</div>
            </div>
          </div>

          {/* Causal Takeaways */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded bg-black/30 border border-space-border/50 text-xs font-mono">
              <span className="font-heading uppercase text-gray-400 block mb-1">Mission A Debrief</span>
              <p className="text-gray-300 text-[11px] leading-relaxed line-clamp-3">
                {missionA.debriefSummary}
              </p>
            </div>
            <div className="p-3 rounded bg-black/30 border border-space-border/50 text-xs font-mono">
              <span className="font-heading uppercase text-gray-400 block mb-1">Mission B Debrief</span>
              <p className="text-gray-300 text-[11px] leading-relaxed line-clamp-3">
                {missionB.debriefSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-space-border bg-space-surface/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-heading uppercase text-xs tracking-wider transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
