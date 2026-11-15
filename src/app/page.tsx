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
  GraduationCap,
  Zap,
} from "lucide-react";
import { useMissionStore } from "@/store/mission";
import { useSettingsStore } from "@/store/settings";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { OnboardingModal } from "@/components/ui/OnboardingModal";

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
  const { hasCompletedOnboarding } = useSettingsStore();
  const [utcTime, setUtcTime] = useState("");
  const [mounted, setMounted] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

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

  // Prompt onboarding on very first visit
  useEffect(() => {
    if (mounted && !hasCompletedOnboarding) {
      setOnboardingOpen(true);
    }
  }, [mounted, hasCompletedOnboarding]);

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
          <span className="text-telemetry-cyan font-mono text-[11px]">SYS REV 2.0.0-STAGE2</span>
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

        <div className="mb-6">
          <Wordmark size="xl" showTagline={true} />
        </div>

        <p className="max-w-xl text-slate-300 font-body text-sm sm:text-base leading-relaxed mb-8">
          Architect, balance, launch, and operate deep-space missions. Trade off payload mass,
          solar flux, thermal dissipation, communications link budgets, and orbital lifespans.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg">
          <Link href="/mission/new" className="w-full sm:w-1/2">
            <Button
              variant="primary"
              size="lg"
              className="w-full flex items-center justify-center gap-2 text-sm tracking-wider shadow-glow-amber"
            >
              <Rocket className="w-4 h-4" />
              <span>NEW MISSION</span>
            </Button>
          </Link>

          <Link href="/academy" className="w-full sm:w-1/2">
            <Button
              variant="outline"
              size="lg"
              className="w-full flex items-center justify-center gap-2 text-sm tracking-wider border-telemetry-amber/50 hover:border-telemetry-amber text-telemetry-amber"
            >
              <GraduationCap className="w-4 h-4 text-telemetry-amber" />
              <span>QUICK START (5 MIN)</span>
            </Button>
          </Link>

          {mounted && currentMission.id && (
            <Link href={`/mission/${currentMission.id}`} className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full flex items-center justify-center gap-2 text-sm tracking-wider"
              >
                <Play className="w-4 h-4 text-telemetry-cyan" />
                <span className="truncate">RESUME</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Secondary Navigation */}
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 mt-8 font-mono text-xs">
          <Link
            href="/academy"
            className="flex items-center gap-1.5 text-slate-300 hover:text-telemetry-amber transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5 text-telemetry-amber" />
            <span>SPACE ACADEMY (6 LESSONS)</span>
          </Link>

          <span className="text-space-border">•</span>

          <Link
            href="/codex"
            className="flex items-center gap-1.5 text-slate-300 hover:text-telemetry-cyan transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-telemetry-cyan" />
            <span>SPACE CODEX (92 TOPICS)</span>
          </Link>

          <span className="text-space-border">•</span>

          <Link
            href="/sandbox"
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SANDBOX STUDIO</span>
          </Link>

          <span className="text-space-border">•</span>

          <button
            type="button"
            onClick={() => setOnboardingOpen(true)}
            className="text-slate-400 hover:text-white transition-colors underline decoration-dotted"
          >
            DIFFICULTY / SETTINGS
          </button>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />

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
