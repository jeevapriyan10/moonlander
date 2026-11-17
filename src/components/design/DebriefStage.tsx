"use client";

import React, { useState, useMemo } from "react";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { generateMissionDebrief, type WhatIfScenario } from "@/engine/debrief";
import { MissionPatch } from "@/components/ui/MissionPatch";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useProfileStore } from "@/store/profile";
import { MissionCardModal } from "@/components/share/MissionCardModal";
import { playAchievement } from "@/lib/audio";
import { orbits, launchers } from "@/data";
import {
  Award,
  RotateCcw,
  PlusCircle,
  Download,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  HelpCircle,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Compass,
  Trophy,
  Share2,
} from "lucide-react";

export const DebriefStage: React.FC = () => {
  const { currentMission, evaluation, opsResult, updateDesign, exportMissionJson } =
    useMissionStore();
  const { setCurrentStage } = useUIStore();

  const [activeWhatIf, setActiveWhatIf] = useState<WhatIfScenario | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);

  const debrief = useMemo(() => {
    return generateMissionDebrief(currentMission, evaluation, opsResult);
  }, [currentMission, evaluation, opsResult]);

  const {
    overallScore,
    overallGrade,
    scoreBreakdown,
    causalDrivers,
    historicalTwin,
    whatIfScenarios,
    operationalSummary,
  } = debrief;

  const gradeColors = {
    S: "text-telemetry-amber border-telemetry-amber shadow-glow-amber bg-telemetry-amber/10",
    A: "text-telemetry-green border-telemetry-green shadow-glow-green bg-telemetry-green/10",
    B: "text-telemetry-cyan border-telemetry-cyan shadow-glow-cyan bg-telemetry-cyan/10",
    C: "text-telemetry-orange border-telemetry-orange bg-telemetry-orange/10",
    D: "text-telemetry-red border-telemetry-red shadow-glow-red bg-telemetry-red/10",
  };

  const { recordMissionDebrief } = useProfileStore();
  const recordedRef = React.useRef(false);

  React.useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    if (overallScore >= 70 || overallGrade === "S" || overallGrade === "A") {
      playAchievement();
    }
    recordMissionDebrief({
      missionName: currentMission.name,
      scenarioId: currentMission.scenarioId,
      seed: currentMission.seed,
      evaluation,
      debriefReport: debrief,
      design: currentMission,
      logEntries: opsResult?.events?.map((e) => ({
        tPlus: e.triggerDay * 86400,
        message: `${e.title}: ${e.description}`,
        severity: e.severity === "critical" ? "critical" : (e.severity === "high" || e.severity === "medium") ? "warning" : "info",
      })) || [],
    });
  }, [currentMission, evaluation, debrief, opsResult, recordMissionDebrief, overallScore, overallGrade]);

  const handleApplyWhatIf = (scenario: WhatIfScenario) => {
    updateDesign(scenario.patch);
    setActiveWhatIf(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="flex flex-col gap-1 border-b border-space-border pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="amber" size="sm">
            STAGE 06 : MISSION EVALUATION & CAUSAL DEBRIEF
          </Badge>
          <Badge
            variant={
              overallGrade === "S" || overallGrade === "A"
                ? "nominal"
                : overallGrade === "B"
                ? "info"
                : "alert"
            }
            size="sm"
          >
            CLASS {overallGrade} MISSION OUTCOME
          </Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-heading uppercase tracking-widest text-white font-bold">
          Post-Flight Systems Audit & Causal Debrief
        </h1>
        <p className="text-xs font-mono text-gray-400">
          Rigorous post-mission evaluation of scientific return, budget efficiency, schedule execution, and on-orbit operations.
        </p>
      </div>

      {/* 2. Top Banner: Composite Scorecard + Official Mission Patch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 rounded-lg border border-space-border bg-space-panel">
        {/* Left: Overall Grade & Composite Score */}
        <div className="lg:col-span-2 flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b lg:border-b-0 lg:border-r border-space-border/60 pb-6 lg:pb-0 lg:pr-6">
          <div
            className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center font-heading text-6xl font-bold shrink-0 ${gradeColors[overallGrade]}`}
          >
            <span>{overallGrade}</span>
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-80 -mt-2">
              Grade
            </span>
          </div>

          <div className="flex flex-col gap-3 flex-1 text-center sm:text-left">
            <div>
              <span className="text-xs font-heading uppercase tracking-widest text-gray-400">
                100-Point Composite Mission Rating
              </span>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-4xl font-mono font-bold text-white">
                  {overallScore}
                </span>
                <span className="text-sm font-mono text-gray-400">
                  / 100 Points
                </span>
              </div>
            </div>

            {/* 5-Category Point Breakdown Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono text-xs">
              {scoreBreakdown.map((item) => (
                <div key={item.category} className="p-2 rounded bg-space-950 border border-space-border/60">
                  <span className="text-[10px] text-gray-500 block uppercase truncate">
                    {item.title}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {item.pointsEarned}
                  </span>
                  <span className="text-[10px] text-gray-400">/{item.maxPoints}</span>
                </div>
              ))}
            </div>

            <p className="text-xs font-mono text-slate-300 leading-relaxed mt-1">
              {evaluation.science.requirementsSummary.allRequirementsMet
                ? "All primary charter milestones fulfilled with certified operational margins."
                : `${evaluation.science.requirementsSummary.metRequirements} of ${evaluation.science.requirementsSummary.totalRequirements} charter requirements completed.`}
            </p>
          </div>
        </div>

        {/* Right: Procedural SVG Mission Patch */}
        <div className="flex flex-col items-center justify-center">
          <span className="font-heading uppercase text-xs tracking-wider text-slate-400 font-bold mb-2">
            Official Flight Insignia Patch
          </span>
          <MissionPatch
            missionName={currentMission.name}
            scenarioId={currentMission.scenarioId}
            seed={currentMission.seed}
            grade={overallGrade}
            size={190}
            showDownload={true}
          />
        </div>
      </div>

      {/* 3. Causal Analysis: "Why Did This Happen?" */}
      <Panel
        title={
          <span className="flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4 text-telemetry-amber" />
            <span>Root-Cause Driver Attribution (Why Did This Happen?)</span>
          </span>
        }
        bodyClassName="p-4 flex flex-col gap-3 font-mono text-xs"
      >
        <p className="text-xs text-slate-400 font-mono mb-1">
          Causal decomposition of primary engineering choices that drove your final score and flight outcome:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {causalDrivers.map((driver, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded border flex flex-col justify-between gap-2 ${
                driver.type === "positive"
                  ? "bg-telemetry-green/10 border-telemetry-green/40 text-slate-200"
                  : "bg-telemetry-orange/10 border-telemetry-orange/40 text-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1 font-heading uppercase text-xs font-bold">
                    {driver.type === "positive" ? (
                      <TrendingUp className="w-3.5 h-3.5 text-telemetry-green" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-telemetry-orange" />
                    )}
                    <span className={driver.type === "positive" ? "text-telemetry-green" : "text-telemetry-orange"}>
                      {driver.subsystem}
                    </span>
                  </div>
                  <Badge variant={driver.type === "positive" ? "nominal" : "warning"} size="sm">
                    {driver.pointsImpact > 0 ? `+${driver.pointsImpact}` : driver.pointsImpact} PTS
                  </Badge>
                </div>

                <h4 className="font-heading uppercase text-xs font-bold text-white mb-1">
                  {driver.headline}
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {driver.explanation}
                </p>
              </div>

              {driver.recommendation && (
                <div className="pt-2 border-t border-space-border/40 text-[10px] text-telemetry-cyan flex items-start gap-1">
                  <HelpCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>Fix: {driver.recommendation}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* 4. Counterfactual What-If Studio */}
      <Panel
        title={
          <span className="flex items-center gap-2 text-white">
            <Compass className="w-4 h-4 text-telemetry-cyan" />
            <span>What-If Counterfactual Re-Simulation Studio</span>
          </span>
        }
        bodyClassName="p-4 flex flex-col gap-3 font-mono text-xs"
      >
        <p className="text-xs text-slate-400 font-mono">
          Explore how alternative engineering decisions would have altered your mission score without rebuilding from scratch:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {whatIfScenarios.map((whatIf) => {
            const isPositive = whatIf.scoreDelta >= 0;
            return (
              <div
                key={whatIf.id}
                className="p-3.5 rounded bg-space-950 border border-space-border hover:border-telemetry-cyan/60 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-heading uppercase text-xs font-bold text-white">
                      {whatIf.title}
                    </span>
                    <Badge variant={isPositive ? "nominal" : "alert"} size="sm">
                      {isPositive ? `+${whatIf.scoreDelta}` : whatIf.scoreDelta} PTS
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                    {whatIf.description}
                  </p>
                  <p className="text-[10px] text-slate-400 italic">
                    {whatIf.tradeoffSummary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-space-border/40">
                  <span className="text-[10px] text-slate-400">
                    Projected: <strong className="text-white">{whatIf.hypotheticalScore} pts (Class {whatIf.hypotheticalGrade})</strong>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyWhatIf(whatIf)}
                    className="text-[10px] py-1 px-2 h-auto"
                  >
                    Apply & Re-run
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* 5. Real NASA / ESA Historical Flight Match */}
      {historicalTwin && (
        <Panel
          title={
            <span className="flex items-center gap-2 text-white">
              <ExternalLink className="w-4 h-4 text-telemetry-amber" />
              <span>NASA / ESA Flight Twin: {historicalTwin.name}</span>
            </span>
          }
          bodyClassName="p-4 flex flex-col gap-4 font-mono text-xs"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="info">{historicalTwin.agency}</Badge>
                <span className="text-slate-400">Launched {historicalTwin.launchYear}</span>
                <span className="text-telemetry-green font-bold uppercase">{historicalTwin.missionStatus}</span>
              </div>
              <h3 className="font-heading uppercase text-base font-bold text-white mb-2">
                {historicalTwin.name} Reference Architecture
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {historicalTwin.lessonsLearned}
              </p>
              <a
                href={historicalTwin.nasaArchiveUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-telemetry-amber hover:underline flex items-center gap-1 font-mono"
              >
                <span>View NASA Mission Operations Archive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Side-by-Side Benchmark Matrix */}
            <div className="p-3 rounded bg-space-950 border border-space-border flex flex-col gap-2">
              <span className="font-heading uppercase text-xs text-slate-400 font-bold border-b border-space-border/50 pb-1">
                Your Spacecraft vs NASA Twin
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Wet Launch Mass:</span>
                <span className="text-white font-bold">
                  {evaluation.mass.totalWetMassKg.toFixed(0)} kg vs {historicalTwin.launchMassKg} kg (NASA)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lifecycle Project Cost:</span>
                <span className="text-white font-bold">
                  ${evaluation.cost.totalMissionCostM.toFixed(1)}M vs ${historicalTwin.totalCostM}M (NASA)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Operational Orbit:</span>
                <span className="text-telemetry-cyan font-bold truncate max-w-[220px]">
                  {historicalTwin.primaryOrbit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Key Scientific Discoveries:</span>
                <span className="text-slate-300 text-[10px] text-right max-w-[220px]">
                  {historicalTwin.keyDiscoveries[0]}
                </span>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* 6. Payload Sensor Performance Breakdown */}
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
            {evaluation.science.instrumentBreakdown.map((item) => (
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

      {/* 7. Bottom Navigation & Export */}
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
          <Link href="/profile">
            <Button size="md" variant="secondary" className="flex items-center gap-1.5 border-telemetry-amber/50 text-telemetry-amber hover:bg-telemetry-amber/10">
              <Trophy className="w-4 h-4" />
              <span>Pilot Dossier & Patches</span>
            </Button>
          </Link>

          <Button
            size="md"
            variant="secondary"
            onClick={() => setShowCardModal(true)}
            className="flex items-center gap-1.5 border-telemetry-cyan/50 text-telemetry-cyan hover:bg-telemetry-cyan/10"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Mission Card</span>
          </Button>

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
              <span>Launch Next Mission</span>
            </Button>
          </Link>
        </div>
      </div>

      <MissionCardModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        data={{
          missionName: currentMission.name,
          scenarioTitle: currentMission.name,
          difficulty: currentMission.difficulty,
          seed: currentMission.seed,
          callsign: useProfileStore.getState().profile.callsign,
          rank: useProfileStore.getState().profile.currentRank,
          score: overallScore,
          grade: overallGrade,
          costM: evaluation?.cost?.totalMissionCostM ?? 85.0,
          massKg: evaluation?.mass?.totalWetMassKg ?? 500,
          deltaVKmS: (evaluation?.propulsion?.deltaVAvailableMs ?? 1800) / 1000,
          scienceReturnPercent: Math.round(overallScore * 0.98),
          orbitName: orbits.find((o) => o.id === currentMission.orbitId)?.name || currentMission.orbitId,
          launcherName: launchers.find((l) => l.id === currentMission.launcherId)?.name || currentMission.launcherId,
          completedDate: new Date().toISOString().split("T")[0]!,
        }}
      />
    </div>
  );
};
