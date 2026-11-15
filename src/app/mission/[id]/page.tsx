"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { TopBar } from "@/components/hud/TopBar";
import { Dashboard } from "@/components/hud/Dashboard";
import { Advisor } from "@/components/hud/Advisor";
import { CatalogPanel } from "@/components/design/CatalogPanel";
import { ObjectiveStage } from "@/components/design/ObjectiveStage";
import { RequirementsStage } from "@/components/design/RequirementsStage";
import { OrbitLaunchStage } from "@/components/design/OrbitLaunchStage";
import { SimulateStage } from "@/components/design/SimulateStage";
import { DebriefStage } from "@/components/design/DebriefStage";
import { StageRail } from "@/components/ui/StageRail";
import {
  SlidersHorizontal,
  Box,
  Eye,
  Activity,
  AlertCircle,
} from "lucide-react";

// Dynamic import for 3D Viewport with ssr: false
const Viewport3D = dynamic(
  () => import("@/components/three/Viewport3D").then((mod) => mod.Viewport3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[350px] flex flex-col items-center justify-center bg-space-bg border border-space-border">
        <div className="w-8 h-8 rounded-full border border-telemetry-amber/30 border-t-telemetry-amber animate-spin mb-3" />
        <span className="font-mono text-xs text-telemetry-amber tracking-wider uppercase">
          SYNCHRONIZING 3D TELEMETRY...
        </span>
      </div>
    ),
  }
);

// Dynamic import for 3D Launch Sequence with ssr: false
const Launch = dynamic(
  () => import("@/components/three/Launch").then((mod) => mod.Launch),
  { ssr: false }
);

export default function MissionWorkspacePage() {
  const params = useParams();
  const scenarioOrId = (params?.id as string) || "earth-watch";

  const { currentMission } = useMissionStore();
  const {
    currentStage,
    setCurrentStage,
    unlockStage,
    mobilePane,
    setMobilePane,
    advisorExpanded,
    launchInProgress,
    setLaunchInProgress,
  } = useUIStore();

  const [mounted, setMounted] = useState(false);

  // Initialize mission state if directly routed
  useEffect(() => {
    setMounted(true);

    const missionStore = useMissionStore.getState();
    const uiStore = useUIStore.getState();

    if (missionStore.savedMissions[scenarioOrId]) {
      missionStore.loadMission(scenarioOrId);
      if (missionStore.savedMissions[scenarioOrId]?.isSandbox) {
        uiStore.unlockStage(6);
      }
    } else if (scenarioOrId === "sandbox") {
      if (!missionStore.currentMission.isSandbox) {
        missionStore.createMission("earth-watch", "ADVANCED", true);
        uiStore.setCurrentStage(3);
      }
      uiStore.unlockStage(6);
    } else if (scenarioOrId === "earth-watch" || scenarioOrId === "exoplanet-hunter") {
      if (
        missionStore.currentMission.scenarioId !== scenarioOrId ||
        missionStore.currentMission.isSandbox
      ) {
        missionStore.createMission(scenarioOrId, "INTERMEDIATE", false);
      }
    } else if (missionStore.currentMission.isSandbox) {
      uiStore.unlockStage(6);
    }
  }, [scenarioOrId]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-space-bg flex items-center justify-center font-mono text-xs text-telemetry-amber">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-telemetry-amber border-t-transparent animate-spin" />
          <span>ESTABLISHING GROUND STATION LINK...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] w-full bg-space-bg flex flex-col overflow-hidden text-slate-200">
      {/* 1. Top Bar */}
      <div className="shrink-0">
        <TopBar />
      </div>

      {/* 2. Persistent Stage Rail */}
      <div className="shrink-0 px-4 py-2 border-b border-space-border bg-space-panel/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <StageRail
            currentStage={currentStage}
            onSelectStage={(stage) => setCurrentStage(stage as 1 | 2 | 3 | 4 | 5 | 6)}
          />
        </div>
      </div>

      {/* 3. Stage View Router */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        {currentStage === 1 && (
          <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8">
            <ObjectiveStage />
          </div>
        )}

        {currentStage === 2 && (
          <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8">
            <RequirementsStage />
          </div>
        )}

        {currentStage === 3 && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Mobile Tab Switcher */}
            <div className="md:hidden flex items-center border-b border-space-border bg-space-panel px-2 py-1 gap-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => setMobilePane("catalog")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded uppercase ${
                  mobilePane === "catalog"
                    ? "bg-telemetry-amber/20 text-telemetry-amber border border-telemetry-amber/40"
                    : "text-slate-400"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Catalog</span>
              </button>

              <button
                type="button"
                onClick={() => setMobilePane("viewport")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded uppercase ${
                  mobilePane === "viewport"
                    ? "bg-telemetry-cyan/20 text-telemetry-cyan border border-telemetry-cyan/40"
                    : "text-slate-400"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>3D View</span>
              </button>

              <button
                type="button"
                onClick={() => setMobilePane("dashboard")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded uppercase ${
                  mobilePane === "dashboard"
                    ? "bg-telemetry-green/20 text-telemetry-green border border-telemetry-green/40"
                    : "text-slate-400"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Gauges</span>
              </button>

              <button
                type="button"
                onClick={() => setMobilePane("advisor")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded uppercase ${
                  mobilePane === "advisor"
                    ? "bg-telemetry-orange/20 text-telemetry-orange border border-telemetry-orange/40"
                    : "text-slate-400"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Advisor</span>
              </button>
            </div>

            {/* Desktop 3-Column Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Subsystem Hardware Catalog */}
              <div
                className={`w-full md:w-[380px] lg:w-[420px] shrink-0 border-r border-space-border bg-space-panel/95 flex flex-col overflow-hidden ${
                  mobilePane !== "catalog" ? "hidden md:flex" : "flex"
                }`}
              >
                <CatalogPanel />
              </div>

              {/* Center Column: 3D Spacecraft Viewport */}
              <div
                className={`flex-1 flex flex-col relative overflow-hidden bg-space-bg ${
                  mobilePane !== "viewport" ? "hidden md:flex" : "flex"
                }`}
              >
                <Viewport3D className="w-full h-full min-h-[350px]" />
              </div>

              {/* Right Column: Live Resource Dashboard */}
              <div
                className={`w-full md:w-[360px] lg:w-[400px] shrink-0 border-l border-space-border bg-space-panel/95 flex flex-col overflow-y-auto ${
                  mobilePane !== "dashboard" ? "hidden md:flex" : "flex"
                }`}
              >
                <Dashboard
                  onProceedToOrbit={() => {
                    unlockStage(4);
                    setCurrentStage(4);
                  }}
                />
              </div>
            </div>

            {/* Bottom Row: Mission Advisor Diagnostics Console */}
            <div
              className={`border-t border-space-border bg-space-panel ${
                mobilePane === "advisor" ? "flex" : advisorExpanded ? "flex" : "hidden md:flex"
              }`}
            >
              <Advisor />
            </div>
          </div>
        )}

        {currentStage === 4 && (
          <div className="flex-1 min-h-0 h-full overflow-hidden relative flex flex-col">
            {launchInProgress ? (
              <Launch
                onComplete={() => {
                  setLaunchInProgress(false);
                  unlockStage(5);
                  setCurrentStage(5);
                }}
                onReturnToDesign={() => {
                  setLaunchInProgress(false);
                  setCurrentStage(3);
                }}
              />
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 h-full">
                <OrbitLaunchStage onStartLaunch={() => setLaunchInProgress(true)} />
              </div>
            )}
          </div>
        )}

        {currentStage === 5 && (
          <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8">
            <SimulateStage />
          </div>
        )}

        {currentStage === 6 && (
          <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8">
            <DebriefStage />
          </div>
        )}
      </div>
    </div>
  );
}
