"use client";

import React, { useState, useEffect } from "react";
import type { CampaignChapter, DialogScene, ScriptNode, ChoiceOption } from "@/data/campaign/types";
import { CHARACTERS } from "@/data/campaign/types";
import { CharacterPortrait } from "./CharacterPortrait";
import { useCampaignStore } from "@/store/campaign";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Play, FastForward, SkipForward, History, ArrowRight, X } from "lucide-react";
import { playTelemetryPulse } from "@/lib/audio/chime";

interface BriefingDossierProps {
  chapter: CampaignChapter;
  scene?: DialogScene;
  onComplete: () => void;
  onCancel?: () => void;
}

export const BriefingDossier: React.FC<BriefingDossierProps> = ({
  chapter,
  scene = chapter.briefing,
  onComplete,
  onCancel,
}) => {
  const { applyReputationDelta, applyModifiers } = useCampaignStore();

  const [currentNodeId, setCurrentNodeId] = useState<string>(scene.startNodeId);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [dialogHistory, setDialogHistory] = useState<Array<{ speaker: string; text: string }>>([]);
  const [showBacklog, setShowBacklog] = useState(false);

  const currentNode: ScriptNode | undefined = scene.nodes[currentNodeId];

  useEffect(() => {
    setCurrentNodeId(scene.startNodeId);
    setDialogHistory([]);
  }, [scene]);

  useEffect(() => {
    if (!currentNode || currentNode.type !== "say") {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    const fullText = currentNode.text;
    let idx = 0;
    setIsTyping(true);
    setDisplayedText("");

    const interval = setInterval(() => {
      idx++;
      setDisplayedText(fullText.slice(0, idx));
      if (idx % 4 === 0) {
        playTelemetryPulse();
      }
      if (idx >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [currentNode]);

  const handleSkipTyping = () => {
    if (currentNode && currentNode.type === "say") {
      setDisplayedText(currentNode.text);
      setIsTyping(false);
    }
  };

  const handleNext = () => {
    if (!currentNode) return;

    if (currentNode.type === "say") {
      const speakerProfile = CHARACTERS[currentNode.speaker];
      setDialogHistory((prev) => [
        ...prev,
        { speaker: speakerProfile?.name || "Officer", text: currentNode.text },
      ]);

      if (currentNode.nextNodeId && scene.nodes[currentNode.nextNodeId]) {
        setCurrentNodeId(currentNode.nextNodeId);
      } else {
        onComplete();
      }
    }
  };

  const handleChoose = (opt: ChoiceOption) => {
    const repDelta = opt.effects.rep || opt.effects.reputation;
    if (repDelta) {
      applyReputationDelta(repDelta);
    }
    if (opt.effects.budgetDeltaM || opt.effects.deadlineDeltaMonths) {
      applyModifiers(opt.effects.budgetDeltaM || 0, opt.effects.deadlineDeltaMonths || 0);
    }

    if (scene.nodes[opt.nextNodeId]) {
      setCurrentNodeId(opt.nextNodeId);
    } else {
      onComplete();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-space-surface border border-space-border/90 shadow-2xl overflow-hidden flex flex-col relative font-sans">
      {/* Dossier Security Header */}
      <div className="bg-black/60 border-b border-space-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="alert" size="sm">
            TOP SECRET // MERIDIAN CLEARANCE
          </Badge>
          <span className="font-mono text-xs text-gray-400">
            {chapter.briefingDate} &bull; REF: {chapter.id.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBacklog(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 border border-space-border hover:border-gray-400 text-xs font-heading uppercase text-gray-300 hover:text-white transition-all"
            title="View Dialog History"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backlog</span>
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Dossier Content */}
      <div className="p-6 md:p-8 space-y-6">
        {/* Chapter Title & Subtitle */}
        <div className="border-b border-space-border/40 pb-4">
          <h2 className="font-heading font-extrabold text-2xl uppercase tracking-wider text-white">
            {chapter.title}
          </h2>
          <p className="font-mono text-xs text-telemetry-cyan uppercase tracking-wider mt-1">
            {chapter.subtitle}
          </p>
        </div>

        {/* Dialog Stage: Speaker + Typewriter Speech */}
        {currentNode && currentNode.type === "say" && (
          <div className="space-y-6">
            <div className="flex items-start gap-5">
              <CharacterPortrait speaker={currentNode.speaker} size={84} />

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-lg text-white uppercase tracking-wider">
                    {CHARACTERS[currentNode.speaker]?.name}
                  </span>
                  <Badge variant="amber" size="sm">
                    {CHARACTERS[currentNode.speaker]?.role}
                  </Badge>
                </div>

                <div
                  className="p-4 rounded-xl bg-black/50 border border-space-border/80 text-sm font-mono text-gray-200 leading-relaxed min-h-[90px] cursor-pointer"
                  onClick={handleSkipTyping}
                >
                  {displayedText}
                  {isTyping && <span className="animate-pulse inline-block w-2 h-4 bg-telemetry-amber ml-1" />}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-2">
              {isTyping ? (
                <button
                  onClick={handleSkipTyping}
                  className="flex items-center gap-1.5 text-xs font-heading uppercase text-gray-400 hover:text-white transition-colors"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Click or press here to skip typing</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-gray-500">
                  Press continue to proceed
                </span>
              )}

              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={isTyping}
                className="flex items-center gap-2 shadow-lg"
              >
                <span>{currentNode.nextNodeId ? "Continue" : "Authorize Mission"}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Choice Stage: Multiple Branching Options */}
        {currentNode && currentNode.type === "choice" && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-telemetry-amber/10 border border-telemetry-amber/30 text-xs font-heading uppercase tracking-wider font-bold text-telemetry-amber">
              {currentNode.prompt}
            </div>

            <div className="space-y-3">
              {currentNode.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChoose(opt)}
                  className="w-full text-left p-4 rounded-xl bg-space-surface/60 border border-space-border hover:border-telemetry-cyan hover:bg-telemetry-cyan/5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-heading font-bold text-sm text-white group-hover:text-telemetry-cyan block transition-colors">
                        {opt.label}
                      </span>
                      <p className="font-mono text-xs text-gray-400">
                        {opt.description}
                      </p>
                    </div>

                    {/* Effect pills */}
                    {opt.effects.rep && (
                      <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                        {opt.effects.rep.science && (
                          <span className={opt.effects.rep.science > 0 ? "text-telemetry-cyan" : "text-telemetry-red"}>
                            {opt.effects.rep.science > 0 ? `+${opt.effects.rep.science}` : opt.effects.rep.science} Sci
                          </span>
                        )}
                        {opt.effects.rep.public && (
                          <span className={opt.effects.rep.public > 0 ? "text-telemetry-green" : "text-telemetry-red"}>
                            {opt.effects.rep.public > 0 ? `+${opt.effects.rep.public}` : opt.effects.rep.public} Pub
                          </span>
                        )}
                        {opt.effects.rep.treasury && (
                          <span className={opt.effects.rep.treasury > 0 ? "text-telemetry-amber" : "text-telemetry-red"}>
                            {opt.effects.rep.treasury > 0 ? `+${opt.effects.rep.treasury}` : opt.effects.rep.treasury} Treas
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Backlog Modal */}
      {showBacklog && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-space-border pb-3 mb-4">
            <h3 className="font-heading uppercase text-sm font-bold text-white tracking-wider">
              Briefing Transmission Backlog
            </h3>
            <button
              onClick={() => setShowBacklog(false)}
              className="p-1 rounded text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-2">
            {dialogHistory.length === 0 ? (
              <span className="text-gray-500">No prior dialog lines recorded.</span>
            ) : (
              dialogHistory.map((item, idx) => (
                <div key={idx} className="p-3 rounded bg-white/5 border border-space-border/40">
                  <span className="font-heading uppercase text-telemetry-amber font-bold block mb-1">
                    {item.speaker}
                  </span>
                  <p className="text-gray-300 leading-relaxed">{item.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
