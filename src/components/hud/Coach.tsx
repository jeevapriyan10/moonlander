"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useMissionStore } from "@/store/mission";
import { useSettingsStore } from "@/store/settings";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { broadcastRadioTransmission } from "@/components/audio/RadioTransmissionLog";
import { speakCapcomMessage } from "@/lib/audio/capcomTts";
import {
  Radio,
  ChevronDown,
  ChevronUp,
  Wrench,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
} from "lucide-react";

export const Coach: React.FC = () => {
  const { currentMission, evaluation, updateDesign } = useMissionStore();
  const { coachEnabled, coachMode, plainLanguage } = useSettingsStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [dismissedIssueId, setDismissedIssueId] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState<1 | 2 | 3>(1);
  const [activeIssueIndex, setActiveIssueIndex] = useState(0);

  // Filter issues based on coach mode (unconditionally at top)
  const relevantIssues = useMemo(() => {
    if (!evaluation) return [];
    if (coachMode === "errors-only") {
      return evaluation.validation.filter((v) => v.severity === "error");
    }
    return evaluation.validation;
  }, [evaluation, coachMode]);

  const currentIssue = relevantIssues[activeIssueIndex];

  // Auto-advance hint level every 8 seconds if user is contemplating
  useEffect(() => {
    setHintLevel(1);
    if (!currentIssue) return;

    const line = currentIssue.message;
    broadcastRadioTransmission("CAPCOM", line);
    speakCapcomMessage(line);

    const timer1 = setTimeout(() => setHintLevel(2), 8000);
    const timer2 = setTimeout(() => setHintLevel(3), 16000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [currentIssue]);

  // If coach disabled or off in settings, don't render
  if (!coachEnabled || coachMode === "off") {
    return null;
  }

  if (!evaluation) return null;

  // If all certified nominal and no errors
  if (relevantIssues.length === 0 || !currentIssue) {
    if (isMinimized) {
      return (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-space-panel/90 border border-telemetry-green/50 text-telemetry-green hover:bg-space-panel text-xs font-mono shadow-panel transition-all"
        >
          <Radio className="w-3.5 h-3.5 text-telemetry-green animate-pulse" />
          <span>CAPCOM: NOMINAL</span>
        </button>
      );
    }

    return (
      <aside aria-label="Flight Director Guidance" className="fixed bottom-4 right-4 z-40 max-w-sm w-full bg-space-panel/95 backdrop-blur-md border border-telemetry-green/40 rounded shadow-panel p-3 text-xs select-none">
        <div className="flex items-center justify-between border-b border-space-border pb-1.5 mb-2">
          <div className="flex items-center gap-2 text-telemetry-green">
            <Radio className="w-3.5 h-3.5" />
            <span className="font-heading uppercase tracking-wider font-bold text-[11px]">
              CAPCOM // FLIGHT ADVISOR
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="text-slate-400 hover:text-white"
            title="Minimize"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-start gap-2 text-slate-300 font-mono text-[11px] leading-relaxed">
          <CheckCircle2 className="w-4 h-4 text-telemetry-green shrink-0 mt-0.5" />
          <p>
            All spacecraft systems and astrodynamics profiles are verified launch-ready. You are cleared to proceed to Orbit &amp; Launch.
          </p>
        </div>
      </aside>
    );
  }

  // When dismissed, show small reopen pill
  if (dismissedIssueId === currentIssue.id && !isMinimized) {
    return (
      <button
        type="button"
        onClick={() => setDismissedIssueId(null)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-space-panel border border-telemetry-amber text-telemetry-amber text-xs font-mono shadow-panel hover:bg-black transition-all"
      >
        <Radio className="w-3.5 h-3.5" />
        <span>REOPEN CAPCOM ADVISORY</span>
      </button>
    );
  }

  // If minimized
  if (isMinimized) {
    return (
      <button
        type="button"
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-space-panel/90 border border-telemetry-amber/80 text-telemetry-amber hover:bg-space-panel text-xs font-mono shadow-panel transition-all animate-pulse"
      >
        <Radio className="w-3.5 h-3.5 text-telemetry-amber" />
        <span>CAPCOM NOTICE ({relevantIssues.length})</span>
      </button>
    );
  }

  const primaryFix = currentIssue.fixes && currentIssue.fixes.length > 0 ? currentIssue.fixes[0] : null;

  const handleApplyFix = () => {
    if (primaryFix) {
      updateDesign(primaryFix.patch);
    }
  };

  return (
    <aside aria-label="Flight Director Guidance" className="fixed bottom-4 right-4 z-40 max-w-md w-full bg-space-panel/95 backdrop-blur-md border border-telemetry-amber/60 rounded shadow-panel p-3.5 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-space-border pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-telemetry-amber animate-ping" />
          <Radio className="w-3.5 h-3.5 text-telemetry-amber" />
          <span className="font-heading uppercase tracking-wider font-bold text-white text-xs">
            CAPCOM // FLIGHT ADVISOR
          </span>
          <Badge
            variant={currentIssue.severity === "error" ? "alert" : "amber"}
            size="sm"
            className="uppercase text-[10px]"
          >
            {currentIssue.severity === "error" ? "CRITICAL HOLD" : "ADVISORY"}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          {relevantIssues.length > 1 && (
            <span className="font-mono text-[10px] text-slate-400 mr-1">
              {activeIssueIndex + 1} of {relevantIssues.length}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1 text-slate-400 hover:text-white rounded"
            title="Minimize"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDismissedIssueId(currentIssue.id)}
            className="p-1 text-slate-400 hover:text-white rounded"
            title="Dismiss advisory"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Advisory Content */}
      <div className="flex flex-col gap-2 font-mono text-xs">
        {/* Title */}
        <div className="text-telemetry-amber font-heading uppercase tracking-wide font-semibold">
          {currentIssue.title}
        </div>

        {/* Level 1: Observation */}
        <div className="text-slate-200 leading-relaxed font-body">
          &ldquo;{currentIssue.message}&rdquo;
        </div>

        {/* Level 2: Specific Cause */}
        {hintLevel >= 2 && (
          <div className="p-2 rounded bg-black/40 border border-space-border/60 text-[11px] text-slate-300">
            <div className="flex items-center gap-1 text-telemetry-cyan font-semibold uppercase text-[10px] mb-0.5">
              <HelpCircle className="w-3 h-3" />
              <span>Root Cause</span>
            </div>
            <p className="leading-relaxed">{currentIssue.why}</p>
            {currentIssue.cause && (
              <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400 border-t border-space-border/40 pt-1">
                <span>{currentIssue.cause.metric}:</span>
                <span className="text-telemetry-red font-bold">{currentIssue.cause.actual}</span>
                <span>Limit: {currentIssue.cause.limit}</span>
              </div>
            )}
          </div>
        )}

        {/* Level 3: Actionable Fix */}
        {hintLevel >= 3 && primaryFix && (
          <div className="mt-1 flex items-center justify-between gap-2 p-2 rounded bg-telemetry-amber/10 border border-telemetry-amber/40">
            <div className="flex items-center gap-1.5 text-telemetry-amber font-semibold text-[11px] leading-tight">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Recommended: {primaryFix.label}</span>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={handleApplyFix}
              className="text-[11px] py-1 px-2.5 shrink-0"
            >
              Apply Fix
            </Button>
          </div>
        )}

        {/* Navigation if multiple issues */}
        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
          {hintLevel < 3 && primaryFix ? (
            <button
              type="button"
              onClick={() => setHintLevel(3)}
              className="text-telemetry-cyan hover:underline flex items-center gap-1"
            >
              <Wrench className="w-3 h-3" />
              <span>Request Fix Guidance</span>
            </button>
          ) : (
            <span />
          )}

          {relevantIssues.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={activeIssueIndex === 0}
                onClick={() => setActiveIssueIndex((i) => Math.max(0, i - 1))}
                className="px-1.5 py-0.5 rounded border border-space-border disabled:opacity-30 hover:border-slate-400"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={activeIssueIndex === relevantIssues.length - 1}
                onClick={() => setActiveIssueIndex((i) => Math.min(relevantIssues.length - 1, i + 1))}
                className="px-1.5 py-0.5 rounded border border-space-border disabled:opacity-30 hover:border-slate-400"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
