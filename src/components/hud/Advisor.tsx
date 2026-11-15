"use client";

import React from "react";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Wrench,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const Advisor: React.FC<{ className?: string }> = ({ className }) => {
  const { evaluation, applyFix } = useMissionStore();
  const { advisorExpanded, setAdvisorExpanded, addToast } = useUIStore();

  const { validation, launchReady } = evaluation;

  const errors = validation.filter((v) => v.severity === "error");
  const warnings = validation.filter((v) => v.severity === "warning");

  const handleApplyFix = (label: string, patch: Record<string, unknown>) => {
    applyFix(patch);
    addToast({
      type: "success",
      title: "Automated Fix Applied",
      message: label,
    });
  };

  const handleFixAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const combinedPatch: Record<string, unknown> = {};
    const appliedFixes: string[] = [];

    for (const issue of validation) {
      if (issue.fixes && issue.fixes.length > 0 && issue.fixes[0]) {
        Object.assign(combinedPatch, issue.fixes[0].patch);
        appliedFixes.push(issue.fixes[0].label);
      }
    }

    if (appliedFixes.length > 0) {
      applyFix(combinedPatch);
      addToast({
        type: "success",
        title: "All Automated Fixes Applied",
        message: `Applied ${appliedFixes.length} engineering fixes: ${appliedFixes.slice(0, 2).join(", ")}${appliedFixes.length > 2 ? "..." : ""}`,
      });
    }
  };

  return (
    <footer
      className={`border-t border-space-border bg-space-panel/95 backdrop-blur-md flex flex-col transition-all duration-200 select-none ${
        advisorExpanded ? "h-64" : "h-11"
      } ${className ?? ""}`}
    >
      {/* Console Header Bar */}
      <div
        onClick={() => setAdvisorExpanded(!advisorExpanded)}
        className="h-11 px-4 flex items-center justify-between cursor-pointer border-b border-space-border/60 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {launchReady ? (
              <ShieldCheck className="w-4 h-4 text-telemetry-green" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-telemetry-red animate-pulse" />
            )}
            <span className="font-heading uppercase text-xs tracking-widest text-gray-200 font-bold">
              Mission Systems Advisor
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {errors.length > 0 && (
              <Badge variant="alert" size="sm">
                {errors.length} {errors.length === 1 ? "Error" : "Errors"}
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge variant="warning" size="sm">
                {warnings.length} {warnings.length === 1 ? "Warning" : "Warnings"}
              </Badge>
            )}
            {validation.length === 0 && (
              <Badge variant="nominal" size="sm">
                Systems Nominal (0 Issues)
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {errors.length > 0 && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleFixAll}
              className="h-7 text-[11px] gap-1.5 px-2.5 font-heading uppercase tracking-wider"
              title="Apply all recommended engineering fixes simultaneously"
            >
              <Wrench className="w-3 h-3" />
              <span>Fix All Issues ({errors.length})</span>
            </Button>
          )}

          <span className="text-[11px] font-mono text-gray-400 hidden sm:inline">
            {launchReady
              ? "FLIGHT STATUS: GO FOR ORBITAL INSERTION"
              : "FLIGHT STATUS: HOLD (UNRESOLVED CONSTRAINTS)"}
          </span>
          <button
            aria-label={advisorExpanded ? "Minimize Advisor" : "Expand Advisor"}
            className="text-gray-400 hover:text-white"
          >
            {advisorExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Issue List */}
      {advisorExpanded && (
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
          {validation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <ShieldCheck className="w-8 h-8 text-telemetry-green mb-1.5" />
              <h4 className="font-heading uppercase text-sm tracking-wider text-gray-200 font-bold">
                All Engineering & Scenario Constraints Satisfied
              </h4>
              <p className="text-xs font-mono text-gray-400 max-w-md mt-1">
                Your spacecraft mass margins, power generation balance, optical resolution, and lifecycle economics meet all NASA flight certification criteria.
              </p>
            </div>
          ) : (
            validation.map((issue) => (
              <div
                key={issue.id}
                className={`p-3 rounded border text-xs flex flex-col gap-2 ${
                  issue.severity === "error"
                    ? "bg-telemetry-red/5 border-telemetry-red/30"
                    : "bg-telemetry-orange/5 border-telemetry-orange/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {issue.severity === "error" ? (
                      <ShieldAlert className="w-4 h-4 text-telemetry-red shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-telemetry-orange shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-heading uppercase tracking-wider text-gray-100 font-bold text-xs">
                        {issue.title}
                      </h4>
                      <p className="text-gray-300 font-mono text-[11px] mt-0.5">
                        {issue.message}
                      </p>
                    </div>
                  </div>

                  <div className="font-mono text-[10px] text-gray-400 text-right shrink-0 bg-black/40 px-2 py-1 rounded border border-space-border/60">
                    <div>
                      <span className="text-gray-500">Metric: </span>
                      <span className="text-gray-200">{issue.cause.metric}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Actual: </span>
                      <span
                        className={
                          issue.severity === "error"
                            ? "text-telemetry-red"
                            : "text-telemetry-orange"
                        }
                      >
                        {issue.cause.actual}
                      </span>
                      <span className="text-gray-500 ml-1.5">Limit: </span>
                      <span className="text-telemetry-green">{issue.cause.limit}</span>
                    </div>
                  </div>
                </div>

                {/* Physics Educational Explanation */}
                <div className="p-2 rounded bg-black/30 border border-space-border/40 text-[11px] font-mono text-gray-400 leading-relaxed flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-telemetry-cyan shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-telemetry-cyan font-heading uppercase tracking-wider">
                      Physics Rationale:{" "}
                    </strong>
                    {issue.why}
                  </span>
                </div>

                {/* Automated Fixes Buttons */}
                {issue.fixes && issue.fixes.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 border-t border-space-border/40">
                    <span className="text-[10px] font-heading uppercase text-gray-400 font-semibold flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-telemetry-amber" />
                      Recommended Fix:
                    </span>
                    {issue.fixes.map((fix, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant="primary"
                        onClick={() => handleApplyFix(fix.label, fix.patch)}
                        className="text-[10px] h-6 px-2.5 font-mono normal-case"
                      >
                        Apply Fix: {fix.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </footer>
  );
};

