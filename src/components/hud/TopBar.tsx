"use client";

import React from "react";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { useSettingsStore } from "@/store/settings";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Wordmark } from "@/components/ui/Wordmark";
import Link from "next/link";
import {
  Rocket,
  Save,
  Share2,
  Download,
  Upload,
  BookOpen,
  Settings,
  HelpCircle,
  Copy,
  Check,
  GraduationCap,
  Sparkles,
  Radio,
  Trophy,
  User,
  Compass,
} from "lucide-react";
import { useProfileStore } from "@/store/profile";
import { OnboardingModal } from "@/components/ui/OnboardingModal";

export const TopBar: React.FC = () => {
  const {
    currentMission,
    updateDesign,
    saveCurrentMission,
    exportMissionJson,
    importMissionJson,
    exportShareCode,
    importShareCode,
    evaluation,
  } = useMissionStore();

  const { addToast } = useUIStore();
  const { profile } = useProfileStore();
  const {
    graphicsQuality,
    setGraphicsQuality,
    reducedMotion,
    setReducedMotion,
    bloomEnabled,
    setBloomEnabled,
    plainLanguage,
    setPlainLanguage,
    coachMode,
    setCoachMode,
  } = useSettingsStore();

  const [isEditingName, setIsEditingName] = React.useState(false);
  const [missionName, setMissionName] = React.useState(currentMission.name);
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [creditsModalOpen, setCreditsModalOpen] = React.useState(false);
  const [onboardingOpen, setOnboardingOpen] = React.useState(false);
  const [importJsonText, setImportJsonText] = React.useState("");
  const [copiedShare, setCopiedShare] = React.useState(false);
  const [shareCodeInput, setShareCodeInput] = React.useState("");

  React.useEffect(() => {
    setMissionName(currentMission.name);
  }, [currentMission.name]);

  const handleSaveName = () => {
    setIsEditingName(false);
    if (missionName.trim()) {
      updateDesign({ name: missionName.trim() });
      addToast({
        type: "success",
        title: "Mission Renamed",
        message: `Updated mission name to "${missionName.trim()}".`,
      });
    }
  };

  const handleCopyShareCode = () => {
    const code = exportShareCode();
    navigator.clipboard.writeText(code);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
    addToast({
      type: "success",
      title: "Share Code Copied",
      message: "Compressed configuration copied to clipboard.",
    });
  };

  const handleImportShareCode = () => {
    if (importShareCode(shareCodeInput.trim())) {
      addToast({
        type: "success",
        title: "Mission Imported",
        message: "Successfully loaded configuration from share code.",
      });
      setShareModalOpen(false);
      setShareCodeInput("");
    } else {
      addToast({
        type: "error",
        title: "Import Failed",
        message: "Invalid share code. Please check the code format.",
      });
    }
  };

  const handleImportJson = () => {
    if (importMissionJson(importJsonText)) {
      addToast({
        type: "success",
        title: "JSON Imported",
        message: "Mission specification imported successfully.",
      });
      setShareModalOpen(false);
      setImportJsonText("");
    } else {
      addToast({
        type: "error",
        title: "Invalid JSON",
        message: "Could not parse mission JSON specification.",
      });
    }
  };

  return (
    <>
      <header className="h-12 bg-space-bg/95 border-b border-space-border px-3.5 flex items-center justify-between select-none z-30">
        {/* Left: Brand + Mission Name + Seed */}
        <div className="flex items-center gap-3">
          <Wordmark size="sm" asLink href="/" />

          <div className="h-4 w-px bg-space-border mx-1" />

          {isEditingName ? (
            <input
              type="text"
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              autoFocus
              className="bg-black/50 border border-telemetry-amber rounded px-2 py-0.5 text-sm font-heading uppercase text-white tracking-wider outline-none"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-sm font-heading uppercase tracking-wider text-gray-200 hover:text-telemetry-amber transition-colors flex items-center gap-1.5"
              title="Click to rename mission"
            >
              <span>{currentMission.name}</span>
            </button>
          )}

          <Badge variant="amber" size="sm">
            {currentMission.seed}
          </Badge>

          <Badge
            variant={currentMission.isSandbox ? "info" : "neutral"}
            size="sm"
          >
            {currentMission.isSandbox ? "SANDBOX" : currentMission.difficulty}
          </Badge>
        </div>

        {/* Right: Actions (Save, Share, Learn, Settings) */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              saveCurrentMission();
              addToast({
                type: "success",
                title: "State Saved",
                message: "Mission telemetry saved to local browser storage.",
              });
            }}
            title="Save Mission Configuration"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareModalOpen(true)}
            title="Export / Import Mission"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share / Export</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPlainLanguage(!plainLanguage);
              addToast({
                type: "info",
                title: !plainLanguage ? "Plain English Mode Activated" : "Engineering Mode Activated",
                message: !plainLanguage ? "Technical jargon translated to plain-English descriptions." : "Standard NASA/AIAA units and engineering acronyms restored.",
              });
            }}
            title="Toggle between Engineering Mode and Plain English Mode"
          >
            <Sparkles className={`w-3.5 h-3.5 ${plainLanguage ? "text-telemetry-green" : "text-slate-400"}`} />
            <span className="hidden lg:inline text-xs">{plainLanguage ? "Plain English" : "Eng Mode"}</span>
          </Button>

          <Link href="/campaign" target="_blank">
            <Button variant="ghost" size="sm" title="Meridian Space Authority Campaign (/campaign)">
              <Compass className="w-3.5 h-3.5 text-telemetry-amber" />
              <span className="hidden md:inline">Campaign</span>
            </Button>
          </Link>

          <Link href="/academy" target="_blank">
            <Button variant="ghost" size="sm" title="Space Academy Lessons (/academy)">
              <GraduationCap className="w-3.5 h-3.5 text-telemetry-amber" />
              <span className="hidden md:inline">Academy</span>
            </Button>
          </Link>

          <Link href="/codex" target="_blank">
            <Button variant="ghost" size="sm" title="Space Codex (/codex)">
              <BookOpen className="w-3.5 h-3.5 text-telemetry-cyan" />
              <span className="hidden md:inline">Codex</span>
            </Button>
          </Link>

          <Link href="/profile" target="_blank">
            <Button variant="ghost" size="sm" title="Pilot Profile & Career History (/profile)">
              <Trophy className="w-3.5 h-3.5 text-telemetry-amber" />
              <span className="hidden xl:inline text-xs font-mono">{profile.callsign} ({profile.currentRank})</span>
              <span className="hidden md:inline xl:hidden">Profile</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsModalOpen(true)}
            title="Engine & Graphics Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      {/* Share / Export Modal */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Mission Sharing & Data Transfer"
        subtitle="Export your spacecraft engineering design or import an external mission manifest."
        maxWidth="lg"
      >
        <div className="flex flex-col gap-4 text-xs">
          {/* Share Code Section */}
          <div className="flex flex-col gap-1.5 p-3 rounded bg-black/40 border border-space-border">
            <span className="font-heading uppercase tracking-wider text-gray-200 font-semibold">
              Share Code (Compressed Manifest)
            </span>
            <p className="text-gray-400 font-mono text-[11px]">
              Copy this lightweight base64 code to share your design with peers or restore it on any device.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={exportShareCode()}
                className="flex-1 bg-space-bg border border-space-border rounded px-2 py-1 font-mono text-[11px] text-telemetry-cyan select-all outline-none"
              />
              <Button size="sm" variant="primary" onClick={handleCopyShareCode}>
                {copiedShare ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedShare ? "Copied" : "Copy"}</span>
              </Button>
            </div>
          </div>

          {/* Import Code Section */}
          <div className="flex flex-col gap-1.5 p-3 rounded bg-black/40 border border-space-border">
            <span className="font-heading uppercase tracking-wider text-gray-200 font-semibold">
              Import from Share Code
            </span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                placeholder="Paste base64 share code here..."
                value={shareCodeInput}
                onChange={(e) => setShareCodeInput(e.target.value)}
                className="flex-1 bg-space-bg border border-space-border rounded px-2 py-1 font-mono text-[11px] text-gray-200 outline-none focus:border-telemetry-amber"
              />
              <Button size="sm" variant="secondary" onClick={handleImportShareCode}>
                <Upload className="w-3.5 h-3.5" />
                <span>Import</span>
              </Button>
            </div>
          </div>

          {/* Raw JSON Export / Import */}
          <div className="flex flex-col gap-1.5 p-3 rounded bg-black/40 border border-space-border">
            <div className="flex items-center justify-between">
              <span className="font-heading uppercase tracking-wider text-gray-200 font-semibold">
                Raw JSON Specification
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(exportMissionJson());
                  addToast({
                    type: "success",
                    title: "JSON Copied",
                    message: "Full JSON copied to clipboard.",
                  });
                }}
              >
                <Copy className="w-3 h-3" />
                <span>Copy JSON</span>
              </Button>
            </div>
            <textarea
              rows={5}
              placeholder="Paste raw mission JSON here to import..."
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full bg-space-bg border border-space-border rounded p-2 font-mono text-[10px] text-gray-300 outline-none focus:border-telemetry-amber"
            />
            {importJsonText && (
              <Button size="sm" variant="primary" onClick={handleImportJson} className="self-end mt-1">
                Apply JSON
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title="Mission Control Settings"
        subtitle="Configure rendering fidelity, motion preferences, and simulation options."
        maxWidth="md"
      >
        <div className="flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded bg-black/30 border border-space-border">
            <div>
              <span className="font-heading uppercase tracking-wider text-gray-200 font-semibold block">
                3D Viewport Quality
              </span>
              <span className="text-gray-400 font-mono text-[11px]">
                Toggle high-precision PBR textures, bloom, and postprocessing.
              </span>
            </div>
            <div className="flex gap-1">
              {(["LOW", "MEDIUM", "HIGH", "ULTRA"] as const).map((q) => (
                <Button
                  key={q}
                  size="sm"
                  variant={graphicsQuality === q ? "primary" : "outline"}
                  onClick={() => setGraphicsQuality(q)}
                  className="text-[10px] px-2 py-0.5"
                >
                  {q === "LOW" ? "Low" : q === "MEDIUM" ? "Med" : q === "HIGH" ? "High" : "Ultra"}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-black/30 border border-space-border">
            <div>
              <span className="font-heading uppercase tracking-wider text-gray-200 font-semibold block">
                Reduced Motion
              </span>
              <span className="text-gray-400 font-mono text-[11px]">
                Disables animated transitions and rapid camera glides.
              </span>
            </div>
            <Button
              size="sm"
              variant={reducedMotion ? "primary" : "outline"}
              onClick={() => setReducedMotion(!reducedMotion)}
            >
              {reducedMotion ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-black/30 border border-space-border">
            <div>
              <span className="font-heading uppercase tracking-wider text-gray-200 font-semibold block">
                Post-Processing Bloom
              </span>
              <span className="text-gray-400 font-mono text-[11px]">
                Soft optical glow on solar arrays, Earth atmosphere, and thrusters.
              </span>
            </div>
            <Button
              size="sm"
              variant={bloomEnabled ? "primary" : "outline"}
              onClick={() => setBloomEnabled(!bloomEnabled)}
            >
              {bloomEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-black/30 border border-space-border">
            <div>
              <span className="font-heading uppercase tracking-wider text-gray-200 font-semibold block">
                Plain English Mode
              </span>
              <span className="text-gray-400 font-mono text-[11px]">
                Translates technical aerospace jargon (ADCS, Isp, Delta-V) into intuitive plain language.
              </span>
            </div>
            <Button
              size="sm"
              variant={plainLanguage ? "primary" : "outline"}
              onClick={() => setPlainLanguage(!plainLanguage)}
            >
              {plainLanguage ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-black/30 border border-space-border">
            <div>
              <span className="font-heading uppercase tracking-wider text-gray-200 font-semibold block">
                CAPCOM Coach Guidance
              </span>
              <span className="text-gray-400 font-mono text-[11px]">
                Configures real-time hints and guidance from the Flight Director.
              </span>
            </div>
            <div className="flex gap-1">
              {(["all", "errors-only", "off"] as const).map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={coachMode === mode ? "primary" : "outline"}
                  onClick={() => setCoachMode(mode)}
                  className="capitalize text-[10px]"
                >
                  {mode === "all" ? "All" : mode === "errors-only" ? "Errors" : "Off"}
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-space-border flex justify-between items-center">
            <span className="text-[11px] font-mono text-slate-400">
              3D Textures & Astrodynamics Data Sources
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCreditsModalOpen(true);
              }}
            >
              Asset Credits
            </Button>
          </div>

          <div className="pt-2 border-t border-space-border flex justify-between items-center">
            <span className="text-[11px] font-mono text-slate-400">
              Need to re-evaluate your flight experience?
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSettingsModalOpen(false);
                setOnboardingOpen(true);
              }}
            >
              Re-run Onboarding
            </Button>
          </div>
        </div>
      </Modal>

      {/* Asset Credits Modal */}
      <Modal
        isOpen={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
        title="3D Planetary Assets & Science Credits"
        subtitle="Open-access NASA datasets, Solar System Scope maps, and astronomical ephemerides."
        maxWidth="lg"
      >
        <div className="flex flex-col gap-3 text-xs font-mono text-slate-300 max-h-[60vh] overflow-y-auto pr-2">
          <div className="p-3 rounded bg-black/40 border border-space-border">
            <span className="text-telemetry-amber font-heading font-semibold text-sm uppercase block mb-1">
              Celestial Body Textures
            </span>
            <p className="text-[11px] text-slate-400 mb-2">
              Earth, Moon, Mars, Venus, Mercury, Jupiter, Saturn, Uranus, Neptune, Sun, and Milky Way skybox maps provided by <strong>Solar System Scope</strong> under Creative Commons Attribution 4.0 International (CC BY 4.0).
            </p>
            <p className="text-[11px] text-slate-400">
              NASA Visible Earth &quot;Blue Marble&quot; and &quot;Black Marble&quot; (2016) night lights and cloud composites are in the public domain.
            </p>
          </div>

          <div className="p-3 rounded bg-black/40 border border-space-border">
            <span className="text-telemetry-cyan font-heading font-semibold text-sm uppercase block mb-1">
              Astrodynamics & Ephemerides
            </span>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
              <li>Analytical Keplerian ephemeris models based on NASA JPL Standish (1992).</li>
              <li>Exoplanet confirmation data from the NASA Exoplanet Archive (Caltech/IPAC).</li>
              <li>Historical space weather energetic particle events from NASA CCMC / DONKI.</li>
            </ul>
          </div>

          <div className="p-3 rounded bg-black/40 border border-space-border text-[11px] text-slate-500 italic">
            MoonLander is an educational space simulation game. No NASA, ESA, JAXA, or ISRO logos or trademarks are used, and no endorsement is implied.
          </div>
        </div>
      </Modal>

      {/* Experience Level Onboarding Modal */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />
    </>
  );
};

