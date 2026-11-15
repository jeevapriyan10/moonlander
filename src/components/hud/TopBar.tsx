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
} from "lucide-react";

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
  const {
    graphicsQuality,
    setGraphicsQuality,
    reducedMotion,
    setReducedMotion,
    bloomEnabled,
    setBloomEnabled,
  } = useSettingsStore();

  const [isEditingName, setIsEditingName] = React.useState(false);
  const [missionName, setMissionName] = React.useState(currentMission.name);
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
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

          <Link href="/learn" target="_blank">
            <Button variant="ghost" size="sm" title="Aerospace Glossary (/learn)">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Learn</span>
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
              <Button
                size="sm"
                variant={graphicsQuality === "LOW" ? "primary" : "outline"}
                onClick={() => setGraphicsQuality("LOW")}
              >
                Low
              </Button>
              <Button
                size="sm"
                variant={graphicsQuality === "HIGH" ? "primary" : "outline"}
                onClick={() => setGraphicsQuality("HIGH")}
              >
                High
              </Button>
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
        </div>
      </Modal>
    </>
  );
};

