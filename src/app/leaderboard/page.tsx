"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { scenarios } from "@/data";
import { useProfileStore } from "@/store/profile";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { LeaderboardEntryDTO } from "@/app/api/leaderboard/route";
import type { SpacecraftDesign } from "@/lib/repository/types";
import {
  Trophy,
  ArrowLeft,
  Calendar,
  Sparkles,
  Rocket,
  ShieldCheck,
  CheckCircle,
  Eye,
  Filter,
  User,
  Flame,
  Clock,
  Layers,
} from "lucide-react";

export default function LeaderboardPage() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const { loadMission, updateDesign } = useMissionStore();
  const { addToast, setCurrentStage } = useUIStore();

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("earth-watch");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"YOUTH" | "INTERMEDIATE" | "ADVANCED">("INTERMEDIATE");
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "weekly" | "daily">("all");
  const [entries, setEntries] = useState<LeaderboardEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Top Design Inspector modal state
  const [inspectingEntry, setInspectingEntry] = useState<LeaderboardEntryDTO | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const queryParams = new URLSearchParams({
      scenarioId: selectedScenarioId,
      difficulty: selectedDifficulty,
      period: selectedPeriod,
    });

    fetch(`/api/leaderboard?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setEntries(data.entries || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load leaderboard:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedScenarioId, selectedDifficulty, selectedPeriod]);

  // Personal best for this scenario from profile or entries
  const myEntry = entries.find((e) => e.callsign.toLowerCase() === profile.callsign.toLowerCase());
  const scenarioPb = profile.personalBests[selectedScenarioId];

  const handleFlyDesign = (design: SpacecraftDesign) => {
    // Clone design into active mission store
    const newId = `mission-${Date.now()}`;
    const clone: SpacecraftDesign = {
      ...design,
      id: newId,
      seed: `ML-${Math.random().toString(36).substring(2, 6).toUpperCase()}-FLY`,
      name: `${design.name} (Flight Copy)`,
    };

    useMissionStore.setState((s) => ({
      currentMission: clone,
      savedMissions: {
        ...s.savedMissions,
        [newId]: clone,
      },
    }));

    addToast({
      type: "success",
      title: "Design Cloned to Flight Deck",
      message: `Loaded ${design.name} architecture. Ready for pre-flight testing.`,
    });

    setInspectingEntry(null);
    setCurrentStage(3);
    router.push(`/mission/${newId}?stage=design`);
  };

  return (
    <div className="min-h-screen bg-space-bg flex flex-col p-4 md:p-8 font-mono text-slate-200">
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-space-border pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-1 -ml-2">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Exit to Flight Deck</span>
                </Button>
              </Link>
              <Badge variant="amber" size="sm">
                STAGE 3 // GLOBAL FLIGHT ROSTER
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-heading uppercase tracking-widest text-white font-bold">
              Global Aerospace Leaderboards
            </h1>
            <p className="text-xs text-gray-400">
              Ranked flight records verified by server-side deterministic astrodynamics simulation. Only callsign &amp; avatar are public.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/replay">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-telemetry-cyan" />
                <span>Descent Replay Vault</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 rounded-xl bg-space-panel/90 border border-space-border flex flex-col gap-4">
          {/* 1. Scenario Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
              Select Mission Scenario
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {scenarios.map((s) => {
                const isSelected = s.id === selectedScenarioId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScenarioId(s.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-heading uppercase whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-telemetry-amber/20 border-telemetry-amber text-telemetry-amber font-bold shadow-glow-amber"
                        : "bg-black/30 border-space-border text-gray-300 hover:text-white"
                    }`}
                  >
                    {s.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Difficulty & Period Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-space-border/60">
            {/* Difficulty Tabs */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Difficulty:</span>
              {(["YOUTH", "INTERMEDIATE", "ADVANCED"] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-2.5 py-1 rounded text-[11px] font-heading uppercase transition-all ${
                    selectedDifficulty === diff
                      ? "bg-telemetry-cyan text-black font-bold"
                      : "bg-black/40 text-gray-400 hover:text-white"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Period Tabs */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Timeframe:</span>
              {(["all", "weekly", "daily"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-2.5 py-1 rounded text-[11px] font-heading uppercase transition-all ${
                    selectedPeriod === p
                      ? "bg-telemetry-green text-black font-bold"
                      : "bg-black/40 text-gray-400 hover:text-white"
                  }`}
                >
                  {p === "all" ? "All-Time" : p === "weekly" ? "Weekly" : "Daily Challenge"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Personal Best Banner */}
        <div className="p-3.5 rounded-lg bg-black/40 border border-telemetry-amber/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-telemetry-amber/20 border border-telemetry-amber flex items-center justify-center text-telemetry-amber font-bold">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400">PILOT CALLSIGN:</span>
              <span className="font-heading uppercase font-bold text-white text-sm">
                {profile.callsign} ({profile.currentRank})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-gray-400 block">Personal Best:</span>
              <span className="text-telemetry-green font-bold">
                {scenarioPb?.bestScore ? `${scenarioPb.bestScore} pts` : myEntry ? `${myEntry.score} pts` : "No Flight Recorded"}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 block">Current Rank:</span>
              <span className="text-telemetry-amber font-bold">
                {myEntry ? `#${myEntry.rank}` : "Unranked"}
              </span>
            </div>
          </div>
        </div>

        {/* Leaderboard Entries Table */}
        <div className="rounded-xl border border-space-border bg-space-panel/90 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-black/60 border-b border-space-border text-gray-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Pilot Callsign</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Cost ($M)</th>
                  <th className="py-3 px-4">Science Return</th>
                  <th className="py-3 px-4">Delta-V</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Blueprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      <div className="w-6 h-6 rounded-full border border-telemetry-amber/30 border-t-telemetry-amber animate-spin mx-auto mb-2" />
                      FETCHING VERIFIED ROSTER...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      No verified scores logged for this scenario / difficulty filter. Be the first to establish a flight record!
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const isMe = entry.callsign.toLowerCase() === profile.callsign.toLowerCase();
                    const isTop3 = entry.rank <= 3;

                    return (
                      <tr
                        key={entry.id}
                        className={`hover:bg-white/5 transition-colors ${
                          isMe ? "bg-telemetry-amber/10 font-semibold" : ""
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-4 font-bold">
                          {entry.rank === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-telemetry-amber text-black flex items-center justify-center text-xs font-black">
                              1
                            </span>
                          ) : entry.rank === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-300 text-black flex items-center justify-center text-xs font-black">
                              2
                            </span>
                          ) : entry.rank === 3 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center text-xs font-black">
                              3
                            </span>
                          ) : (
                            <span className="text-gray-400">#{entry.rank}</span>
                          )}
                        </td>

                        {/* Pilot Callsign */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-heading uppercase tracking-wide text-xs">
                              {entry.callsign}
                            </span>
                            {isMe && (
                              <span className="text-[9px] px-1 rounded bg-telemetry-amber/20 text-telemetry-amber border border-telemetry-amber/40">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Score */}
                        <td className="py-3 px-4">
                          <span
                            className={`font-bold font-mono ${
                              isTop3 ? "text-telemetry-amber" : "text-white"
                            }`}
                          >
                            {entry.score.toLocaleString()}
                          </span>
                        </td>

                        {/* Cost */}
                        <td className="py-3 px-4 text-gray-300">
                          ${entry.costM.toFixed(1)}M
                        </td>

                        {/* Science */}
                        <td className="py-3 px-4 text-telemetry-green font-bold">
                          {entry.scienceReturnPercent}%
                        </td>

                        {/* Delta-V */}
                        <td className="py-3 px-4 text-telemetry-cyan">
                          {entry.deltaVKmS.toFixed(2)} km/s
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-[10px] text-gray-400">
                          {new Date(entry.completedAt).toLocaleDateString()}
                        </td>

                        {/* Blueprint Fly This Design */}
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInspectingEntry(entry)}
                            className="flex items-center gap-1 text-[11px] hover:text-telemetry-cyan"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Design</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Design Inspector Modal */}
      {inspectingEntry && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingEntry(null)}
          title={`Spacecraft Architecture: ${inspectingEntry.designSnapshot.name}`}
          subtitle={`Verified Flight Record by ${inspectingEntry.callsign}  |  Score: ${inspectingEntry.score} pts`}
          maxWidth="md"
        >
          <div className="flex flex-col gap-4 font-mono text-xs text-slate-200">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-black/40 border border-space-border text-[11px]">
              <div>
                <span className="text-gray-400 block text-[10px]">BUS CLASS:</span>
                <span className="text-white font-semibold">{inspectingEntry.designSnapshot.busId}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">ORBIT REGIME:</span>
                <span className="text-telemetry-cyan font-semibold">{inspectingEntry.designSnapshot.orbitId}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">LAUNCH SERVICES:</span>
                <span className="text-telemetry-green font-semibold">{inspectingEntry.designSnapshot.launcherId}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">PROPULSION:</span>
                <span className="text-white font-semibold">
                  {inspectingEntry.designSnapshot.propulsionId} ({inspectingEntry.designSnapshot.propellantMassKg} kg)
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">SOLAR ARRAY:</span>
                <span className="text-telemetry-amber font-semibold">
                  {inspectingEntry.designSnapshot.solarArrayAreaM2} m²
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">BATTERY CAPACITY:</span>
                <span className="text-white font-semibold">
                  {inspectingEntry.designSnapshot.batteryCapacityWh} Wh
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 p-3 rounded-lg bg-black/40 border border-space-border">
              <span className="text-gray-400 text-[10px] block">PAYLOAD INSTRUMENTS:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {inspectingEntry.designSnapshot.selectedInstrumentIds.map((inst) => (
                  <span
                    key={inst}
                    className="text-[10px] px-2 py-0.5 rounded bg-telemetry-cyan/15 border border-telemetry-cyan/40 text-telemetry-cyan"
                  >
                    {inst}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-space-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInspectingEntry(null)}
              >
                Close
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleFlyDesign(inspectingEntry.designSnapshot)}
                className="flex items-center gap-1.5"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Fly This Design</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
