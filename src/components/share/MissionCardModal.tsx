"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  generateMissionCardBlob,
  downloadBlobAsFile,
  copyBlobToClipboard,
  type MissionCardData,
} from "@/lib/share/missionCard";
import { Download, Copy, Check, Share2, Sparkles } from "lucide-react";
import { useUIStore } from "@/store/ui";

interface MissionCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MissionCardData;
}

export const MissionCardModal: React.FC<MissionCardModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const { addToast } = useUIStore();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let activeUrl: string | null = null;
    setIsGenerating(true);

    generateMissionCardBlob(data)
      .then((b) => {
        if (!isMounted) return;
        setBlob(b);
        activeUrl = URL.createObjectURL(b);
        setPreviewUrl(activeUrl);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error("Failed to generate mission card:", err);
        setIsGenerating(false);
      });

    return () => {
      isMounted = false;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [isOpen, data]);

  const handleDownload = () => {
    if (!blob) return;
    const filename = `moonlander-${data.seed.toLowerCase()}-debrief.png`;
    downloadBlobAsFile(blob, filename);
    addToast({
      type: "success",
      title: "Mission Card Downloaded",
      message: `Saved ${filename} to your device.`,
    });
  };

  const handleCopy = async () => {
    if (!blob) return;
    const success = await copyBlobToClipboard(blob);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast({
        type: "success",
        title: "Card Copied",
        message: "High-res mission card copied to clipboard.",
      });
    } else {
      addToast({
        type: "info",
        title: "Clipboard Unsupported",
        message: "Use the Download PNG button to save the card.",
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Shareable Mission Debrief Card"
      subtitle="High-resolution cryptographic mission certificate card generated from verified physics telemetry."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4 font-mono text-xs text-slate-200">
        {/* Card Image Preview */}
        <div className="w-full aspect-[1200/630] rounded-lg border border-space-border bg-black/60 overflow-hidden flex items-center justify-center shadow-2xl relative">
          {isGenerating || !previewUrl ? (
            <div className="flex flex-col items-center gap-2 text-telemetry-amber">
              <div className="w-8 h-8 rounded-full border border-telemetry-amber/30 border-t-telemetry-amber animate-spin" />
              <span className="text-[11px] uppercase tracking-wider">
                COMPOSITING FLIGHT CARD...
              </span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Mission Certificate"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-space-border/60">
          <span className="text-[10px] text-gray-400">
            1200 x 630 PNG  |  Deterministic Seed: {data.seed}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!blob || isGenerating}
              className="flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-telemetry-green" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              disabled={!blob || isGenerating}
              className="flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
