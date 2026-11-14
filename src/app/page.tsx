"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Rocket,
  Play,
  Layers,
  BookOpen,
  Terminal,
  Activity,
  Radio,
  Clock,
  Sparkles,
} from "lucide-react";
import { useMissionStore } from "@/store/mission";
import { Button } from "@/components/ui/Button";

// Dynamically import Three.js Canvas with ssr: false
const CanvasWrapper = dynamic(
  () => import("@/components/three/CanvasWrapper").then((mod) => mod.CanvasWrapper),
  { ssr: false }
);
const CameraRig = dynamic(
  () => import("@/components/three/CameraRig").then((mod) => mod.CameraRig),
  { ssr: false }
);
const Earth = dynamic(
  () => import("@/components/three/Earth").then((mod) => mod.Earth),
  { ssr: false }
);

export default function TitlePage() {
  const { currentMission } = useMissionStore();
  const [utcTime, setUtcTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-space-bg">
      {/* Background 3D Viewport: Slow-rotating cinematic Earth */}
      <div className="absolute inset-0 z-0 opacity-40">
        <CanvasWrapper className="w-full h-full" enablePostProcessing={false}>
          <CameraRig preset="earth" autoRotate={true} autoRotateSpeed={0.15} />
          <Earth radius={4.2} rotationSpeed={0.015} showClouds={true} />
        </CanvasWrapper>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none bg-mission-grid z-0 opacity-40" />

      {/* Header telemetry band */}
      <header className="relative z-10 w-full border-b border-space-border bg-space-panel/80 backdrop-blur-md px-6 py-3 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-telemetry-amber">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-semibold uppercase tracking-widest text-[11px]">
              NETWORK: DEEP SPACE TELEMETRY ACTIVE
            </span>
          </div>
          <span className="text-space-border">|</span>
          <span className="text-slate-400 hidden sm:inline">NODAL LINK: NOMINAL</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-telemetry-cyan" />
            <span className="font-mono text-slate-200">{utcTime || "00:00:00 UTC"}</span>
          </div>
          <span className="text-space-border">|</span>
          <span className="text-telemetry-cyan font-mono text-[11px]">SYS REV 1.0.4-STAGE1</span>
        </div>
      </header>

      {/* Hero center console */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col items-center text-center my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-telemetry-amber/30 bg-telemetry-amber/10 mb-6 backdrop-blur-md">
          <Activity className="w-3.5 h-3.5 text-telemetry-amber" />
          <span className="font-heading text-xs uppercase tracking-widest text-telemetry-amber">
            HIGH-FIDELITY ASTRODYNAMICS & SYSTEMS SIMULATION
          </span>
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-heading uppercase font-bold tracking-tight text-white mb-4">
          MISSION<span className="text-telemetry-amber">FORGE</span>
        </h1>

        <p className="max-w-xl text-slate-300 font-body text-sm sm:text-base leading-relaxed mb-8">
          Architect, balance, and launch real-world aerospace missions. Trade off payload mass,
          solar flux, thermal dissipation, communications link budgets, and orbital lifespans.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
          <Link href="/mission/new" className="w-full">
            <Button
              variant="primary"
              size="lg"
              className="w-full flex items-center justify-center gap-2 text-sm tracking-wider shadow-glow-amber"
            >
              <Rocket className="w-4 h-4" />
              <span>NEW MISSION</span>
            </Button>
          </Link>

          {mounted && currentMission.id && (
            <Link href={`/mission/${currentMission.id}`} className="w-full">
              <Button
                variant="outline"
                size="lg"
                className="w-full flex items-center justify-center gap-2 text-sm tracking-wider"
              >
                <Play className="w-4 h-4 text-telemetry-cyan" />
                <span>RESUME ({currentMission.name.slice(0, 14)})</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Secondary Navigation */}
        <div className="flex items-center gap-6 mt-8">
          <Link
            href="/sandbox"
            className="flex items-center gap-1.5 font-mono text-xs text-slate-400 hover:text-telemetry-cyan transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SANDBOX STUDIO</span>
          </Link>

          <span className="text-space-border">•</span>

          <Link
            href="/learn"
            className="flex items-center gap-1.5 font-mono text-xs text-slate-400 hover:text-telemetry-amber transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ORBITAL LEXICON (35)</span>
          </Link>
        </div>
      </div>

      {/* Footer telemetry bar */}
      <footer className="relative z-10 w-full border-t border-space-border bg-space-panel/90 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-telemetry-amber" />
          <span>FLIGHT SYSTEMS KERNEL: ACTIVE</span>
          <span className="text-space-border">|</span>
          <span className="text-slate-300">TSIOLKOVSKY + KEPLERIAN 6-DOF + NASA-STD</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-500">STAGE 1 RELEASE</span>
          <div className="flex items-center gap-1 text-telemetry-green text-[11px]">
            <Sparkles className="w-3 h-3" />
            <span>VERCEL EDGE COMPATIBLE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
