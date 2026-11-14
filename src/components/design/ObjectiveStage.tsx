"use client";

import React from "react";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { scenarios } from "@/data";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Compass,
  ArrowRight,
  Globe2,
  Calendar,
  DollarSign,
  Clock,
  Target,
} from "lucide-react";

export const ObjectiveStage: React.FC = () => {
  const { currentMission } = useMissionStore();
  const { setCurrentStage, unlockStage } = useUIStore();

  const scenario =
    scenarios.find((s) => s.id === currentMission.scenarioId) ?? scenarios[0]!;

  const handleProceed = () => {
    unlockStage(2);
    setCurrentStage(2);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 border-b border-space-border pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="amber" size="sm">
            STAGE 01 : MISSION CHARTER
          </Badge>
          <Badge variant="info" size="sm">
            ANALOGUE: {scenario.analogue}
          </Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-heading uppercase tracking-widest text-white font-bold">
          {scenario.title}
        </h1>
        <p className="text-sm font-mono text-telemetry-cyan">
          {scenario.subtitle}
        </p>
      </div>

      {/* Briefing Card */}
      <Panel
        title={
          <span className="flex items-center gap-2 text-telemetry-amber">
            <Compass className="w-4 h-4" />
            <span>Mission Directives & Context</span>
          </span>
        }
        bodyClassName="flex flex-col gap-4 p-5"
      >
        <p className="text-sm font-mono text-gray-200 leading-relaxed">
          {scenario.briefing}
        </p>

        <div className="p-3.5 rounded bg-black/40 border border-space-border text-xs font-mono text-gray-300 leading-relaxed flex items-start gap-2.5">
          <Globe2 className="w-4 h-4 text-telemetry-cyan shrink-0 mt-0.5" />
          <div>
            <strong className="text-telemetry-cyan font-heading uppercase tracking-wider block mb-0.5">
              Real-World Spaceflight Heritage:
            </strong>
            {scenario.realWorldContext}
          </div>
        </div>

        {/* Mission Constraints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded bg-black/30 border border-space-border/80 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-telemetry-amber" />
            <div>
              <span className="text-[10px] font-heading uppercase text-gray-400 block">
                Lifecycle Funding Ceiling
              </span>
              <span className="text-base font-mono font-bold text-gray-100">
                ${scenario.budgetCapM.toFixed(1)}M
              </span>
            </div>
          </div>

          <div className="p-3 rounded bg-black/30 border border-space-border/80 flex items-center gap-3">
            <Clock className="w-6 h-6 text-telemetry-cyan" />
            <div>
              <span className="text-[10px] font-heading uppercase text-gray-400 block">
                Development Schedule Limit
              </span>
              <span className="text-base font-mono font-bold text-gray-100">
                {scenario.deadlineMonths} Months
              </span>
            </div>
          </div>

          <div className="p-3 rounded bg-black/30 border border-space-border/80 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-telemetry-green" />
            <div>
              <span className="text-[10px] font-heading uppercase text-gray-400 block">
                Target Operational Life
              </span>
              <span className="text-base font-mono font-bold text-gray-100">
                {scenario.targetLifeYears.toFixed(1)} Years
              </span>
            </div>
          </div>
        </div>
      </Panel>

      {/* Target Requirements Preview */}
      <Panel
        title={
          <span className="flex items-center gap-2 text-gray-200">
            <Target className="w-4 h-4 text-telemetry-cyan" />
            <span>Key Observational Objectives</span>
          </span>
        }
        bodyClassName="p-4 flex flex-col gap-2"
      >
        <ul className="flex flex-col gap-2">
          {scenario.requirementsList.map((req, idx) => (
            <li
              key={idx}
              className="flex items-center gap-2 text-xs font-mono text-gray-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-telemetry-amber shrink-0" />
              <span>{req}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-end pt-4 border-t border-space-border mt-2">
          <Button
            size="lg"
            variant="primary"
            onClick={handleProceed}
            className="flex items-center gap-2"
          >
            <span>Review Formal Requirements Matrix</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Panel>
    </div>
  );
};

