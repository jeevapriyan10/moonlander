"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCampaignStore } from "@/store/campaign";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { useHasHydrated } from "@/lib/useHasHydrated";
import { CAMPAIGN_CHAPTERS } from "@/data/campaign/chapters";
import type { CampaignChapter } from "@/data/campaign/types";
import { BriefingDossier } from "@/components/campaign/BriefingDossier";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Compass,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Award,
  Globe,
  Radio,
  Sun,
  Telescope,
  Moon,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default function CampaignPage() {
  const hasHydrated = useHasHydrated();
  const router = useRouter();

  const {
    completedChapterIds,
    activeChapterId,
    reputation,
    completeChapter,
    resetCampaign,
  } = useCampaignStore();

  const { createMission } = useMissionStore();
  const { setCurrentStage } = useUIStore();

  const [inspectingChapter, setInspectingChapter] = useState<CampaignChapter | null>(null);
  const [inBriefing, setInBriefing] = useState(false);

  // Campaign Multiple Endings Calculation
  const isCampaignFinished = completedChapterIds.includes("ch-10");
  const [showEndingModal, setShowEndingModal] = useState(false);

  useEffect(() => {
    if (isCampaignFinished) {
      setShowEndingModal(true);
    }
  }, [isCampaignFinished]);

  const endingData = React.useMemo(() => {
    if (!isCampaignFinished) return null;
    const { science, public: pub, treasury } = reputation;

    if (science >= 65 && science >= pub && science >= treasury) {
      return {
        title: "The Knowledge Vanguard",
        subtitle: "Technocratic Hegemony",
        badge: "TECHNOCRATIC HEGEMONY",
        colorVariant: "info" as const,
        description:
          "Under your direction, the Meridian Space Authority prioritized uncompromising astrophysics and planetary science. The council ceded command to research institutes, launching deep-space autonomous observatories across the Kuiper belt. Humanity's understanding of cosmic origins accelerated by a century.",
        quote: "Dr. Lucia Ferreira: 'We did not merely survive out here. We opened our eyes.'",
      };
    }
    if (pub >= 65 && pub >= science && pub >= treasury) {
      return {
        title: "The People's Cosmos",
        subtitle: "Democratic Frontier",
        badge: "PUBLIC BEACON",
        colorVariant: "nominal" as const,
        description:
          "You made spaceflight an inspiring global civil movement. Through transparent briefings, livestreamed descent operations, and educational access, millions rallied behind your missions. The Council voted to charter the first international civilian settlements on the Moon and Mars.",
        quote: "Director Imani Okafor: 'The stars no longer belong to corporations or defense ministries. They belong to all of us.'",
      };
    }
    if (treasury >= 65 && treasury >= science && treasury >= pub) {
      return {
        title: "Commercial Titan",
        subtitle: "Frugal Industrial Empire",
        badge: "FRUGAL DYNASTY",
        colorVariant: "amber" as const,
        description:
          "Rigorous fiscal discipline and lean payload trades turned the Meridian Authority into a self-sustaining economic powerhouse. Commercial orbital logistics, asteroid resource syndicates, and low-cost reusable architectures ensured humanity's expansion became permanently profitable.",
        quote: "Liaison Arthur Hale: 'Every gram balanced. Every dollar justified. That is how empires outlive their founders.'",
      };
    }
    if (science >= 45 && pub >= 45 && treasury >= 45) {
      return {
        title: "The Golden Concord",
        subtitle: "Equilibrium Era",
        badge: "VOID PIONEERS",
        colorVariant: "amber" as const,
        description:
          "In an unprecedented feat of systems governance, you balanced fiscal responsibility, public transparency, and relentless scientific discovery. Meridian became the gold standard of interplanetary stewardship, unlocking permanent bases from Shackleton Crater to Kraken Mare.",
        quote: "CAPCOM Master Log: 'All three flags stand tall. The frontier is steady.'",
      };
    }
    return {
      title: "The Fragile Frontier",
      subtitle: "Hard-Won Survival",
      badge: "STALLED HORIZON",
      colorVariant: "alert" as const,
      description:
        "The Meridian Space Authority survived the catastrophe of 2041, but political friction and budget compromises left humanity's presence in deep space fragile. The outposts endure, yet every budget cycle remains a battle for the horizon.",
      quote: "Meridian Flight Log: 'We held the line. The next generation must push it forward.'",
    };
  }, [isCampaignFinished, reputation]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-space-bg flex items-center justify-center p-6 text-telemetry-amber font-mono text-xs">
        ESTABLISHING MERIDIAN COMMAND LINK...
      </div>
    );
  }

  const handleStartBriefing = (chapter: CampaignChapter) => {
    setInspectingChapter(chapter);
    setInBriefing(true);
  };

  const handleLaunchMission = (chapter: CampaignChapter) => {
    createMission(chapter.linkedScenarioId, "INTERMEDIATE", false);
    setCurrentStage(1);
    router.push(`/mission/${chapter.linkedScenarioId}?stage=objective`);
  };

  // Group chapters by Act
  const acts = [
    { act: 0, title: "Prologue: Induction", chapters: CAMPAIGN_CHAPTERS.filter((c) => c.act === 0) },
    { act: 1, title: "Act I: Earth Operations", chapters: CAMPAIGN_CHAPTERS.filter((c) => c.act === 1) },
    { act: 2, title: "Act II: The Lunar Gateway & Touchdown", chapters: CAMPAIGN_CHAPTERS.filter((c) => c.act === 2) },
    { act: 3, title: "Act III: Deep Solar System & The Outer Moons", chapters: CAMPAIGN_CHAPTERS.filter((c) => c.act === 3) },
  ];

  return (
    <div className="min-h-screen bg-space-bg text-gray-200 flex flex-col">
      {/* Top Header */}
      <header className="h-14 border-b border-space-border bg-space-surface/80 backdrop-blur px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-heading uppercase text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Flight Ops</span>
          </Link>
          <span className="text-gray-600">/</span>
          <h1 className="font-heading font-extrabold text-sm uppercase tracking-wider text-white">
            Meridian Space Authority // 2041 Campaign
          </h1>
        </div>

        <button
          onClick={() => {
            if (confirm("Reset campaign progress back to Prologue?")) {
              resetCampaign();
            }
          }}
          className="flex items-center gap-1 px-3 py-1 rounded text-[11px] font-heading uppercase text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Campaign</span>
        </button>
      </header>

      {/* Main Campaign Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-8">
        {/* Authority Strategic Status Card */}
        <div className="p-6 rounded-2xl bg-space-surface border border-space-border relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Mission Director Dossier */}
            <div className="lg:col-span-4 space-y-1">
              <Badge variant="amber" size="sm">
                MERIDIAN FLIGHT DIRECTOR
              </Badge>
              <h2 className="font-heading font-black text-2xl uppercase tracking-wider text-white">
                Year 2041 Strategic Initiative
              </h2>
              <p className="font-mono text-xs text-gray-400 leading-relaxed">
                Rebuild orbital capability following the loss of the Meridian-1 flagship. Satisfy the civilian council, secure public funding, and establish a permanent human foothold on the Moon.
              </p>
            </div>

            {/* Three Reputation Tracks */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-space-border/60 pt-4 lg:pt-0 lg:pl-6 font-mono text-xs">
              {/* Science Prestige */}
              <div className="p-3 rounded-xl bg-black/40 border border-space-border/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-heading uppercase text-telemetry-cyan font-bold">Science Prestige</span>
                  <span className="text-white font-bold">{reputation.science}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/80 border border-space-border overflow-hidden">
                  <div
                    className="h-full bg-telemetry-cyan transition-all duration-500"
                    style={{ width: `${reputation.science}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 block">Lead: Dr. Lucia Ferreira</span>
              </div>

              {/* Public Trust */}
              <div className="p-3 rounded-xl bg-black/40 border border-space-border/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-heading uppercase text-telemetry-green font-bold">Public Trust</span>
                  <span className="text-white font-bold">{reputation.public}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/80 border border-space-border overflow-hidden">
                  <div
                    className="h-full bg-telemetry-green transition-all duration-500"
                    style={{ width: `${reputation.public}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 block">Lead: Director Imani Okafor</span>
              </div>

              {/* Treasury Solvency */}
              <div className="p-3 rounded-xl bg-black/40 border border-space-border/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-heading uppercase text-telemetry-amber font-bold">Treasury Solvency</span>
                  <span className="text-white font-bold">{reputation.treasury}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/80 border border-space-border overflow-hidden">
                  <div
                    className="h-full bg-telemetry-amber transition-all duration-500"
                    style={{ width: `${reputation.treasury}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 block">Oversight: Liaison Arthur Hale</span>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Acts Progression Tree */}
        <div className="space-y-8">
          {acts.map((actGroup) => (
            <div key={actGroup.act} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-space-border/60 pb-2">
                <Badge variant={actGroup.act === 0 ? "neutral" : actGroup.act === 1 ? "info" : "amber"} size="sm">
                  ACT {actGroup.act}
                </Badge>
                <h3 className="font-heading font-extrabold text-base uppercase tracking-wider text-white">
                  {actGroup.title}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {actGroup.chapters.map((ch) => {
                  const isCompleted = completedChapterIds.includes(ch.id);
                  const globalIdx = CAMPAIGN_CHAPTERS.findIndex((c) => c.id === ch.id);
                  const prevCh = globalIdx > 0 ? CAMPAIGN_CHAPTERS[globalIdx - 1] : null;
                  const isUnlocked =
                    ch.id === "prologue" ||
                    ch.id === "ch-1" ||
                    (prevCh ? completedChapterIds.includes(prevCh.id) : false);

                  return (
                    <div
                      key={ch.id}
                      className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                        isCompleted
                          ? "bg-space-surface border-telemetry-green/50 shadow-md"
                          : isUnlocked
                          ? "bg-space-surface border-telemetry-cyan/60 hover:border-telemetry-cyan shadow-lg"
                          : "bg-space-surface/40 border-space-border/30 opacity-50"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-telemetry-amber uppercase">
                            {ch.briefingDate}
                          </span>
                          {isCompleted ? (
                            <Badge variant="nominal" size="sm">
                              COMPLETED
                            </Badge>
                          ) : isUnlocked ? (
                            <Badge variant="info" size="sm">
                              ACTIVE DIRECTIVE
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              CLASSIFIED
                            </Badge>
                          )}
                        </div>

                        <h4 className="font-heading font-black text-lg uppercase text-white tracking-wide">
                          {ch.title}
                        </h4>
                        <p className="font-mono text-xs text-telemetry-cyan uppercase">
                          {ch.subtitle}
                        </p>
                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 pt-1">
                          {ch.summary}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-space-border/40 flex items-center justify-between">
                        <span className="font-mono text-[10px] text-telemetry-amber">
                          +{ch.rewards.xp} XP
                        </span>

                        {isUnlocked ? (
                          <Button
                            variant={isCompleted ? "secondary" : "primary"}
                            size="sm"
                            onClick={() => handleStartBriefing(ch)}
                            className="flex items-center gap-1.5"
                          >
                            <span>{isCompleted ? "Review Orders" : "Open Dossier"}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-gray-500">
                            <Lock className="w-3 h-3" />
                            <span>Locked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Campaign Finale / Epilogue Card */}
          {endingData && (
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-space-surface via-space-panel to-black/80 border-2 border-telemetry-amber/50 shadow-2xl relative overflow-hidden space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-space-border pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={endingData.colorVariant} size="sm">
                    {endingData.badge}
                  </Badge>
                  <span className="font-mono text-xs text-telemetry-amber uppercase tracking-wider font-bold">
                    OFFICIAL CAMPAIGN CONCLUDED // MERIDIAN ARCHIVE RECORD
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEndingModal(true)}
                  className="flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Grand Epilogue</span>
                </Button>
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-black text-2xl md:text-3xl uppercase tracking-wider text-white">
                  Ending: {endingData.title}
                </h3>
                <p className="font-mono text-xs text-telemetry-cyan uppercase tracking-wide">
                  Strategic Doctrine: {endingData.subtitle}
                </p>
              </div>

              <p className="text-slate-300 text-xs md:text-sm font-mono leading-relaxed max-w-3xl">
                {endingData.description}
              </p>

              <div className="p-3 rounded-lg bg-black/50 border border-space-border/80 font-mono text-xs text-telemetry-amber italic">
                {endingData.quote}
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link href="/credits">
                  <Button variant="primary" size="md" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Scientific Citations & Credits</span>
                  </Button>
                </Link>
                <Link href="/mission/sandbox">
                  <Button variant="secondary" size="md" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Open Freeform Sandbox</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Campaign Grand Finale Ending Modal */}
      {showEndingModal && endingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-2xl border-2 border-telemetry-amber/60 bg-space-panel shadow-2xl flex flex-col gap-6 text-left my-auto">
            <div className="flex items-center justify-between border-b border-space-border pb-3">
              <div className="flex items-center gap-2">
                <Badge variant={endingData.colorVariant} size="sm">
                  {endingData.badge}
                </Badge>
                <span className="font-mono text-xs text-slate-400 uppercase">
                  Meridian Council Historical Ledger
                </span>
              </div>
              <button
                onClick={() => setShowEndingModal(false)}
                className="text-slate-400 hover:text-white font-mono text-xs uppercase"
              >
                [Close]
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="font-heading font-black text-3xl uppercase tracking-wider text-white">
                {endingData.title}
              </h2>
              <p className="font-mono text-xs text-telemetry-cyan uppercase tracking-widest">
                Outcome Doctrine: {endingData.subtitle}
              </p>
            </div>

            <p className="text-slate-200 text-xs md:text-sm font-mono leading-relaxed">
              {endingData.description}
            </p>

            <div className="p-4 rounded-xl bg-black/60 border border-space-border space-y-2">
              <div className="font-heading uppercase text-xs font-bold text-white tracking-wider">
                Authority Final Reputation Standings
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1">
                <div className="p-2 rounded bg-space-bg border border-space-border">
                  <span className="text-[10px] text-telemetry-cyan block">SCIENCE PRESTIGE</span>
                  <span className="text-lg font-bold text-white">{reputation.science}%</span>
                </div>
                <div className="p-2 rounded bg-space-bg border border-space-border">
                  <span className="text-[10px] text-telemetry-green block">PUBLIC TRUST</span>
                  <span className="text-lg font-bold text-white">{reputation.public}%</span>
                </div>
                <div className="p-2 rounded bg-space-bg border border-space-border">
                  <span className="text-[10px] text-telemetry-amber block">TREASURY SOLVENCY</span>
                  <span className="text-lg font-bold text-white">{reputation.treasury}%</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-telemetry-amber/30 text-xs font-mono text-telemetry-amber italic">
              {endingData.quote}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-space-border">
              <Link href="/credits">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Citations & Credits</span>
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowEndingModal(false)}
                >
                  Return to Campaign Map
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Briefing Dossier Modal Overlay */}
      {inBriefing && inspectingChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <BriefingDossier
            chapter={inspectingChapter}
            onComplete={() => {
              setInBriefing(false);
              handleLaunchMission(inspectingChapter);
            }}
            onCancel={() => setInBriefing(false)}
          />
        </div>
      )}
    </div>
  );
}
