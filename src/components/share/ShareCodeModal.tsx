"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { useRouter } from "next/navigation";
import { Copy, Check, Upload, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

interface ShareCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareCodeModal: React.FC<ShareCodeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { currentMission, exportShareCode, importShareCode } = useMissionStore();
  const { addToast, setCurrentStage } = useUIStore();

  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentCode = exportShareCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast({
      type: "success",
      title: "Share Code Copied",
      message: "Compressed design code copied to clipboard.",
    });
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = inputCode.trim();
    if (!trimmed) return;

    try {
      const success = importShareCode(trimmed);
      if (success) {
        const loaded = useMissionStore.getState().currentMission;
        addToast({
          type: "success",
          title: "Design Imported",
          message: `Loaded "${loaded.name}" into workspace.`,
        });
        setCurrentStage(3);
        onClose();
        router.push(`/mission/${loaded.id}?stage=design`);
      } else {
        setErrorMsg("Invalid share code. Please check that you copied the complete string.");
      }
    } catch {
      setErrorMsg("Failed to parse mission design code.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Spacecraft Design Share Code"
      subtitle="Export compressed design specifications or import flight-proven blueprints from fellow engineers."
      maxWidth="md"
    >
      <div className="flex flex-col gap-5 font-mono text-xs text-slate-200">
        {/* Export Current Design */}
        <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-black/40 border border-space-border">
          <span className="font-heading uppercase text-xs font-bold text-telemetry-amber">
            Export Current Spacecraft Design
          </span>
          <p className="text-[11px] text-gray-400">
            Share this portable base64 blueprint with other pilots to let them load your exact component trade study.
          </p>

          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              readOnly
              value={currentCode}
              className="flex-1 px-2.5 py-1.5 bg-black/60 border border-space-border rounded text-[10px] text-telemetry-cyan font-mono truncate"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-1.5 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-telemetry-green" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>

        {/* Import External Design */}
        <form onSubmit={handleImport} className="flex flex-col gap-2.5 p-3.5 rounded-lg bg-black/40 border border-space-border">
          <span className="font-heading uppercase text-xs font-bold text-telemetry-cyan">
            Import Design Blueprint
          </span>
          <p className="text-[11px] text-gray-400">
            Paste a MoonLander share code to inspect and fly that specific spacecraft architecture.
          </p>

          <textarea
            rows={3}
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Paste code here (e.g. ML-V1-eyJuYW1lIjoi...)"
            className="w-full px-2.5 py-1.5 bg-black/60 border border-space-border rounded text-[10px] text-white font-mono focus:outline-none focus:border-telemetry-cyan"
            required
          />

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-red-400 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button variant="primary" size="sm" type="submit" className="flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Load &amp; Fly Design</span>
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
