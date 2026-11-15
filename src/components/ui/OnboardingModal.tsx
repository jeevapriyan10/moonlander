"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { useSettingsStore, type DifficultyPreference, type CoachMode } from "@/store/settings";
import { useMissionStore } from "@/store/mission";
import {
  Sparkles,
  Compass,
  Cpu,
  GraduationCap,
  Rocket,
  CheckCircle2,
  Terminal,
} from "lucide-react";

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const {
    setPlainLanguage,
    setCoachMode,
    setDifficultyPreference,
    setHasCompletedOnboarding,
  } = useSettingsStore();
  const { updateDesign } = useMissionStore();

  const handleSelectExperience = (
    difficulty: DifficultyPreference,
    plainLang: boolean,
    coach: CoachMode,
    redirectTo?: string
  ) => {
    setDifficultyPreference(difficulty);
    setPlainLanguage(plainLang);
    setCoachMode(coach);
    setHasCompletedOnboarding(true);

    try {
      updateDesign({ difficulty });
    } catch {
      // Ignore if no mission active
    }

    onClose();

    if (redirectTo) {
      router.push(redirectTo);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Welcome to MoonLander Flight Systems"
      subtitle="Configure your telemetry experience level to tailor simulation fidelity and guidance."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4 text-xs font-mono">
        <div className="text-center py-2 px-3 rounded bg-space-bg border border-space-border/80">
          <span className="font-heading uppercase tracking-widest text-telemetry-amber text-xs font-semibold block mb-0.5">
            FLIGHT SYSTEMS QUESTIONNAIRE
          </span>
          <span className="text-slate-300 font-body text-xs">
            Have you designed spacecraft or studied orbital astrodynamics before?
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Option 1: Brand New */}
          <button
            type="button"
            onClick={() => handleSelectExperience("YOUTH", true, "all", "/academy")}
            className="flex flex-col text-left p-3.5 rounded border border-space-border hover:border-telemetry-cyan bg-black/40 hover:bg-space-panel/80 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded bg-telemetry-cyan/10 border border-telemetry-cyan/30 text-telemetry-cyan group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <Badge variant="info" size="sm" className="text-[10px]">
                CADET
              </Badge>
            </div>

            <h4 className="font-heading uppercase tracking-wider text-white text-sm font-bold mb-1 group-hover:text-telemetry-cyan transition-colors">
              Brand New
            </h4>

            <p className="text-[11px] font-body text-slate-300 leading-relaxed mb-3">
              I want to learn spaceflight without getting overwhelmed by equations.
            </p>

            <div className="mt-auto pt-2 border-t border-space-border/50 text-[10px] text-slate-400 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-telemetry-green">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Plain English Active</span>
              </div>
              <div className="flex items-center gap-1.5 text-telemetry-green">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>CAPCOM Coach On</span>
              </div>
              <div className="flex items-center gap-1.5 text-telemetry-amber font-semibold mt-1">
                <GraduationCap className="w-3 h-3 shrink-0" />
                <span>Recommended: Space Academy</span>
              </div>
            </div>
          </button>

          {/* Option 2: Some Basics */}
          <button
            type="button"
            onClick={() => handleSelectExperience("INTERMEDIATE", false, "errors-only")}
            className="flex flex-col text-left p-3.5 rounded border border-telemetry-amber/50 hover:border-telemetry-amber bg-black/40 hover:bg-space-panel/80 transition-all group shadow-glow-amber/5"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded bg-telemetry-amber/10 border border-telemetry-amber/30 text-telemetry-amber group-hover:scale-105 transition-transform">
                <Compass className="w-4 h-4" />
              </div>
              <Badge variant="amber" size="sm" className="text-[10px]">
                STANDARD
              </Badge>
            </div>

            <h4 className="font-heading uppercase tracking-wider text-white text-sm font-bold mb-1 group-hover:text-telemetry-amber transition-colors">
              Some Basics
            </h4>

            <p className="text-[11px] font-body text-slate-300 leading-relaxed mb-3">
              I play KSP or follow rocketry. I know Delta-V and orbits, but want safety rails.
            </p>

            <div className="mt-auto pt-2 border-t border-space-border/50 text-[10px] text-slate-400 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3 h-3 shrink-0 text-telemetry-amber" />
                <span>Standard Aerospace Units</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3 h-3 shrink-0 text-telemetry-amber" />
                <span>Coach on Errors Only</span>
              </div>
              <div className="flex items-center gap-1.5 text-telemetry-amber font-semibold mt-1">
                <Rocket className="w-3 h-3 shrink-0" />
                <span>Standard Mission Profiles</span>
              </div>
            </div>
          </button>

          {/* Option 3: Engineer / Expert */}
          <button
            type="button"
            onClick={() => handleSelectExperience("ADVANCED", false, "off")}
            className="flex flex-col text-left p-3.5 rounded border border-space-border hover:border-telemetry-purple bg-black/40 hover:bg-space-panel/80 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded bg-telemetry-purple/10 border border-telemetry-purple/30 text-telemetry-purple group-hover:scale-105 transition-transform">
                <Cpu className="w-4 h-4" />
              </div>
              <Badge variant="neutral" size="sm" className="text-[10px]">
                EXPERT
              </Badge>
            </div>

            <h4 className="font-heading uppercase tracking-wider text-white text-sm font-bold mb-1 group-hover:text-telemetry-purple transition-colors">
              I&apos;m an Engineer
            </h4>

            <p className="text-[11px] font-body text-slate-300 leading-relaxed mb-3">
              Give me raw telemetry, perturbation physics, full radiation, and zero hand-holding.
            </p>

            <div className="mt-auto pt-2 border-t border-space-border/50 text-[10px] text-slate-400 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3 h-3 shrink-0 text-telemetry-purple" />
                <span>Deep Systems Engineering</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3 h-3 shrink-0 text-telemetry-purple" />
                <span>Coach Disabled (Pure Ops)</span>
              </div>
              <div className="flex items-center gap-1.5 text-telemetry-purple font-semibold mt-1">
                <Terminal className="w-3 h-3 shrink-0" />
                <span>Open Sandbox Unlocked</span>
              </div>
            </div>
          </button>
        </div>

        <div className="text-center text-[11px] text-slate-500 pt-1">
          You can toggle Plain English, change difficulty, or adjust coaching anytime from Settings.
        </div>
      </div>
    </Modal>
  );
};
