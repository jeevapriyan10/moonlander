"use client";

import React, { useState } from "react";
import type { MissionHistoryRecord } from "@/lib/repository/types";
import { Badge } from "@/components/ui/Badge";
import { MissionPatch } from "@/components/ui/MissionPatch";
import { X, Play, RotateCcw, Trash2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";

interface MissionDetailModalProps {
  record: MissionHistoryRecord;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const MissionDetailModal: React.FC<MissionDetailModalProps> = ({
  record,
  onClose,
  onDelete,
}) => {
  const router = useRouter();
  const { createMission } = useMissionStore();
  const { setCurrentStage } = useUIStore();
  const [logFilter, setLogFilter] = useState<"all" | "warnings">("all");

  const handleReflySeed = () => {
    // Initialize a new mission with the same scenario and seed
    createMission(record.scenarioId, "INTERMEDIATE", false);
    const missionStore = useMissionStore.getState();
    missionStore.updateDesign({
      ...record.designSnapshot,
      seed: record.seed,
      name: `${record.missionName} (R-2)`,
    });
    setCurrentStage(3);
    router.push(`/mission/${record.scenarioId}?stage=design`);
  };

  const logs = record.logEntries || [];
  const filteredLogs = logFilter === "warnings"
    ? logs.filter((l) => l.severity === "warning" || l.severity === "critical")
    : logs;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-space-bg border border-space-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-space-border bg-space-surface/50">
          <div className="flex items-center gap-3">
            <Badge variant={record.success ? "nominal" : "alert"}>
              {record.success ? "MISSION SUCCESS" : "MISSION FAILED"}
            </Badge>
            <h2 className="font-heading uppercase text-sm tracking-wider font-bold text-white">
              {record.missionName}
            </h2>
            <span className="font-mono text-xs text-gray-400">
              {record.scenarioId} &bull; {record.seed}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Hero: Patch + Scorecard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-space-surface/40 border border-space-border/60 items-center">
            {/* Mission Patch */}
            <div className="flex flex-col items-center justify-center">
              <MissionPatch
                missionName={record.missionName}
                scenarioId={record.scenarioId}
                seed={record.seed}
                grade={record.grade}
                size={140}
              />
              <span className="font-heading uppercase text-[10px] text-gray-400 tracking-wider mt-2">
                Official Flight Insignia
              </span>
            </div>

            {/* Score & Grade */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="font-heading text-4xl font-extrabold text-white">
                  {record.score}
                </span>
                <span className="font-mono text-xs text-gray-400">/ 100 COMPOSITE SCORE</span>
                <Badge
                  variant={
                    record.grade === "S"
                      ? "amber"
                      : record.grade === "A"
                      ? "nominal"
                      : record.grade === "B"
                      ? "info"
                      : "warning"
                  }
                  size="md"
                >
                  GRADE {record.grade}
                </Badge>
              </div>

              {/* 5-pillar score breakdown */}
              {record.debriefReport?.scoreBreakdown && record.debriefReport.scoreBreakdown.length > 0 && (
                <div className="grid grid-cols-5 gap-2 pt-2 border-t border-space-border/40 font-mono text-xs">
                  {record.debriefReport.scoreBreakdown.map((item) => (
                    <div key={item.category}>
                      <span className="text-[10px] text-gray-400 block font-heading uppercase">{item.category}</span>
                      <span className="font-bold text-white">{item.pointsEarned}/{item.maxPoints}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="font-mono text-xs text-gray-300 leading-relaxed pt-2">
                {record.debriefSummary}
              </p>
            </div>
          </div>

          {/* Telemetry Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-black/40 border border-space-border/60">
              <span className="text-[10px] text-gray-400 font-heading uppercase block">Lifecycle Cost</span>
              <span className="text-white font-bold text-sm">${record.costM.toFixed(1)}M</span>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-space-border/60">
              <span className="text-[10px] text-gray-400 font-heading uppercase block">Wet Launch Mass</span>
              <span className="text-white font-bold text-sm">{record.massKg.toFixed(1)} kg</span>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-space-border/60">
              <span className="text-[10px] text-gray-400 font-heading uppercase block">Delta-V Capacity</span>
              <span className="text-white font-bold text-sm">{record.deltaVKmS.toFixed(2)} km/s</span>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-space-border/60">
              <span className="text-[10px] text-gray-400 font-heading uppercase block">Orbit Regime</span>
              <span className="text-telemetry-cyan font-bold text-sm uppercase">{record.orbitId}</span>
            </div>
          </div>

          {/* Root-Cause Drivers */}
          {record.debriefReport?.causalDrivers && record.debriefReport.causalDrivers.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-heading uppercase text-xs tracking-wider text-gray-400 font-bold">
                Attribution & Root-Cause Drivers
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {record.debriefReport.causalDrivers.map((drv, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2.5 ${
                      drv.type === "positive"
                        ? "bg-telemetry-green/5 border-telemetry-green/30"
                        : "bg-telemetry-red/5 border-telemetry-red/30"
                    }`}
                  >
                    <span
                      className={`font-heading font-bold text-xs ${
                        drv.type === "positive" ? "text-telemetry-green" : "text-telemetry-red"
                      }`}
                    >
                      {drv.pointsImpact > 0 ? `+${drv.pointsImpact}` : drv.pointsImpact}
                    </span>
                    <div>
                      <span className="font-bold text-white block">{drv.headline}</span>
                      <span className="text-gray-400 text-[11px] leading-relaxed block mt-0.5">
                        {drv.explanation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flight Director Log Replay */}
          {logs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-heading uppercase text-xs tracking-wider text-gray-400 font-bold">
                  Flight Director Event Log ({logs.length} events)
                </h4>
                <div className="flex gap-1">
                  <button
                    onClick={() => setLogFilter("all")}
                    className={`px-2 py-0.5 rounded text-[10px] font-heading uppercase ${
                      logFilter === "all" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    All Events
                  </button>
                  <button
                    onClick={() => setLogFilter("warnings")}
                    className={`px-2 py-0.5 rounded text-[10px] font-heading uppercase ${
                      logFilter === "warnings" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Anomalies Only
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg bg-black/50 border border-space-border/60 p-3 space-y-1.5 font-mono text-xs">
                {filteredLogs.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-2 py-0.5 border-b border-white/5 last:border-0">
                    <span className="text-telemetry-amber whitespace-nowrap text-[11px]">
                      T+{(entry.tPlus / 86400).toFixed(1)}d
                    </span>
                    <span
                      className={`text-[11px] leading-tight ${
                        entry.severity === "critical"
                          ? "text-telemetry-red font-bold"
                          : entry.severity === "warning"
                          ? "text-telemetry-amber"
                          : "text-gray-300"
                      }`}
                    >
                      {entry.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-space-border bg-space-surface/50 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to permanently delete this mission record?")) {
                onDelete(record.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-telemetry-red hover:bg-telemetry-red/10 border border-telemetry-red/30 font-heading uppercase text-xs tracking-wider transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Record
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-heading uppercase text-xs tracking-wider transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleReflySeed}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-telemetry-amber hover:bg-telemetry-amber/90 text-black font-heading font-bold uppercase text-xs tracking-wider transition-colors shadow-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-Fly Seed ({record.seed})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
