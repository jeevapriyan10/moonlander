"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Rocket,
  ArrowLeft,
  DollarSign,
  Calendar,
  Lock,
  Compass,
  CheckCircle2,
  Sliders,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { scenarios } from "@/data";
import { useMissionStore, type DifficultyLevel } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";

export default function NewMissionPage() {
  const router = useRouter();
  const { initMission, setDifficulty } = useMissionStore();
  const { setCurrentStage } = useUIStore();

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("earth-watch");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>("INTERMEDIATE");

  const playableScenarios = scenarios.filter((s) => s.playable);
  const futureScenarios = scenarios.filter((s) => !s.playable);

  const handleLaunchScenario = (scenarioId: string) => {
    initMission(scenarioId);
    setDifficulty(selectedDifficulty);
    setCurrentStage(1);
    router.push(`/mission/${scenarioId}`);
  };

  return (
    <div className="min-h-screen bg-space-bg flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-space-border">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-space-panel"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ABORT TO TITLE</span>
          </Link>
          <span className="text-space-border">/</span>
          <h1 className="font-heading uppercase tracking-widest text-lg text-white">
            SELECT MISSION CHARTER
          </h1>
        </div>

        {/* Global Difficulty Selector */}
        <div className="flex items-center gap-2 p-1 rounded bg-space-panel border border-space-border text-xs font-heading tracking-wider">
          <Sliders className="w-3.5 h-3.5 text-telemetry-amber ml-1.5" />
          <span className="text-slate-400 mr-1 uppercase">FLIGHT MARGIN:</span>
          {(["YOUTH", "INTERMEDIATE", "ADVANCED"] as DifficultyLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSelectedDifficulty(level)}
              className={`px-2.5 py-1 rounded transition-colors uppercase ${
                selectedDifficulty === level
                  ? "bg-telemetry-amber text-space-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </header>

      {/* Main Catalog of Scenarios */}
      <main className="max-w-6xl w-full mx-auto my-8 flex-1">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-telemetry-amber font-mono text-xs mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>AUTHORIZED FLIGHT CAMPAIGNS // STAGE 1 READY</span>
          </div>
          <p className="text-sm text-slate-400">
            Select an operational profile to begin spacecraft configuration, delta-v sizing, and payload trade studies.
          </p>
        </div>

        {/* Playable Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {playableScenarios.map((scenario) => {
            const isSelected = selectedScenarioId === scenario.id;
            return (
              <div
                key={scenario.id}
                onClick={() => setSelectedScenarioId(scenario.id)}
                className={`relative flex flex-col justify-between p-6 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-space-panel-elevated border-telemetry-amber shadow-glow-amber"
                    : "bg-space-panel border-space-border hover:border-space-border-active"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="warning">{scenario.difficulty}</Badge>
                        <span className="font-mono text-xs text-telemetry-cyan">
                          NASA Analogue: {scenario.analogue}
                        </span>
                      </div>
                      <h2 className="text-2xl font-heading uppercase font-bold text-white tracking-wide">
                        {scenario.title}
                      </h2>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-6 h-6 text-telemetry-amber shrink-0 animate-in fade-in zoom-in-75" />
                    )}
                  </div>

                  <p className="text-xs text-slate-300 font-body leading-relaxed mb-6">
                    {scenario.briefing}
                  </p>

                  {/* Requirements Matrix Pillbox */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded bg-space-bg border border-space-border text-xs font-mono mb-6">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <DollarSign className="w-3.5 h-3.5 text-telemetry-amber" />
                      <span>Budget:</span>
                      <span className="font-bold text-white">${scenario.budgetCapM}M</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-telemetry-cyan" />
                      <span>Deadline:</span>
                      <span className="font-bold text-white">{scenario.deadlineMonths} mo</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Compass className="w-3.5 h-3.5 text-telemetry-green" />
                      <span>Target:</span>
                      <span className="font-bold text-white uppercase">{scenario.targetOrbitId}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Shield className="w-3.5 h-3.5 text-telemetry-orange" />
                      <span>Life:</span>
                      <span className="font-bold text-white">{scenario.targetLifeYears} yr</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant={isSelected ? "primary" : "secondary"}
                  size="md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunchScenario(scenario.id);
                  }}
                  className="w-full flex items-center justify-center gap-2 font-heading tracking-wider"
                >
                  <Rocket className="w-4 h-4" />
                  <span>INITIALIZE MISSION WORKSPACE</span>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Locked Scenarios Teaser (Stage 2/3 Roadmap) */}
        <div>
          <div className="flex items-center gap-2 text-slate-500 font-mono text-xs uppercase mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>EXPANSION PROFILES // UNLOCKS IN STAGES 2 & 3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {futureScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="p-4 rounded border border-space-border/50 bg-space-panel/30 opacity-60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-slate-400">
                      {scenario.analogue}
                    </span>
                    <Badge variant="outline">STAGE 2</Badge>
                  </div>
                  <h3 className="font-heading uppercase text-sm text-slate-300 font-semibold mb-1">
                    {scenario.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {scenario.briefing}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-space-border/30 flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span>${scenario.budgetCapM}M CAP</span>
                  <span className="uppercase">{scenario.targetOrbitId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-space-border flex items-center justify-between text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-telemetry-cyan" />
          <span>REAL-WORLD AEROSPACE FLIGHT DATASETS LOADED</span>
        </div>
        <Link href="/sandbox" className="text-telemetry-amber hover:underline">
          Switch to Open Sandbox Mode →
        </Link>
      </footer>
    </div>
  );
}
