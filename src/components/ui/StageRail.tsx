"use client";

import React from "react";
import { useUIStore, type GameStage } from "@/store/ui";
import { useMissionStore } from "@/store/mission";
import { cn } from "@/lib/utils";
import { Lock, Check, ChevronRight } from "lucide-react";

export interface StageItem {
  id: GameStage;
  label: string;
  code: string;
  badge?: string;
}

export const STAGES: StageItem[] = [
  { id: 1, label: "Objective", code: "01" },
  { id: 2, label: "Requirements", code: "02" },
  { id: 3, label: "Design", code: "03" },
  { id: 4, label: "Orbit & Launch", code: "04" },
  { id: 5, label: "Simulate", code: "05", badge: "Stage 2" },
  { id: 6, label: "Debrief", code: "06", badge: "Stage 2" },
];

export interface StageRailProps {
  className?: string;
  currentStage?: GameStage;
  onSelectStage?: (stage: GameStage) => void;
}

export const StageRail: React.FC<StageRailProps> = ({
  className,
  currentStage: propCurrentStage,
  onSelectStage: propOnSelectStage,
}) => {
  const storeUI = useUIStore();
  const currentStage = propCurrentStage ?? storeUI.currentStage;
  const maxUnlockedStage = storeUI.maxUnlockedStage;
  const setCurrentStage = propOnSelectStage ?? storeUI.setCurrentStage;
  const { evaluation } = useMissionStore();

  return (
    <nav
      aria-label="Mission Engineering Progression"
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 bg-space-panel/90 border-b border-space-border backdrop-blur-md overflow-x-auto no-scrollbar",
        className
      )}
    >
      <div className="flex items-center gap-1 shrink-0 mr-2 text-[11px] font-heading uppercase text-gray-400 tracking-widest select-none">
        <span className="w-2 h-2 rounded-full bg-telemetry-amber animate-pulse" />
        Mission Rail:
      </div>

      <div className="flex items-center gap-1.5 flex-1 min-w-max">
        {STAGES.map((st, idx) => {
          const isCurrent = currentStage === st.id;
          const isUnlocked = st.id <= maxUnlockedStage;
          const isCompleted = st.id < currentStage;

          return (
            <React.Fragment key={st.id}>
              <button
                onClick={() => isUnlocked && setCurrentStage(st.id as GameStage)}
                disabled={!isUnlocked}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded transition-all duration-150 select-none font-heading uppercase tracking-wider text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-telemetry-amber",
                  isCurrent
                    ? "bg-telemetry-amber text-space-bg font-bold shadow-glow-amber border border-telemetry-amber"
                    : isUnlocked
                      ? "text-gray-300 hover:text-white hover:bg-white/5 border border-transparent"
                      : "text-gray-600 border border-transparent cursor-not-allowed opacity-60"
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[10px] w-4 h-4 rounded flex items-center justify-center shrink-0",
                    isCurrent
                      ? "bg-space-bg text-telemetry-amber font-bold"
                      : isCompleted
                        ? "bg-telemetry-green/20 text-telemetry-green"
                        : "bg-white/10 text-gray-500"
                  )}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : st.code}
                </span>

                <span className="whitespace-nowrap">{st.label}</span>

                {st.badge && (
                  <span
                    className={cn(
                      "text-[9px] px-1 py-0.2 rounded font-mono uppercase",
                      isCurrent
                        ? "bg-space-bg text-telemetry-amber"
                        : "bg-white/5 text-gray-500 border border-space-border"
                    )}
                  >
                    {st.badge}
                  </span>
                )}

                {!isUnlocked && <Lock className="w-3 h-3 text-gray-600 ml-0.5" />}
              </button>

              {idx < STAGES.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};

