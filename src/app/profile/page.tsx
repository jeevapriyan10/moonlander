"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/store/profile";
import { useHasHydrated } from "@/lib/useHasHydrated";
import { getXpProgress, RANK_TIERS } from "@/engine/profile/ranks";
import { achievements, type Achievement } from "@/data";
import { PilotAvatar } from "@/components/profile/PilotAvatar";
import { MissionPatch } from "@/components/ui/MissionPatch";
import { MissionDetailModal } from "@/components/profile/MissionDetailModal";
import { MissionCompareModal } from "@/components/profile/MissionCompareModal";
import type { MissionHistoryRecord } from "@/lib/repository/types";
import { Badge } from "@/components/ui/Badge";
import {
  Trophy,
  Award,
  Clock,
  Rocket,
  Shield,
  Zap,
  Globe,
  Radio,
  Download,
  Upload,
  ArrowUpDown,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  XCircle,
  Edit2,
  Check,
  X,
  Lock,
  Sparkles,
  Layers,
  ArrowLeft,
  BookOpen,
} from "lucide-react";

export default function ProfilePage() {
  const hasHydrated = useHasHydrated();
  const router = useRouter();

  const {
    profile,
    history,
    setCallsign,
    toggleDemoMode,
    deleteHistoryRecord,
    clearHistory,
    exportHistoryJson,
    importHistoryJson,
  } = useProfileStore();

  const [activeTab, setActiveTab] = useState<"history" | "achievements" | "patches" | "bests">("history");
  const [editingCallsign, setEditingCallsign] = useState(false);
  const [tempCallsign, setTempCallsign] = useState(profile.callsign);

  // History table filters
  const [historySearch, setHistorySearch] = useState("");
  const [scenarioFilter, setScenarioFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"date" | "score" | "cost">("date");
  const [sortAsc, setSortAsc] = useState(false);

  // Modals & Comparison state
  const [selectedRecord, setSelectedRecord] = useState<MissionHistoryRecord | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Achievement category filter
  const [achCategory, setAchCategory] = useState<string>("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const xpProgress = useMemo(() => getXpProgress(profile.xp), [profile.xp]);

  const handleSaveCallsign = () => {
    setCallsign(tempCallsign);
    setEditingCallsign(false);
  };

  const toggleCompareSelection = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((item) => item !== id));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[1]!, id]);
      } else {
        setSelectedForCompare([...selectedForCompare, id]);
      }
    }
  };

  const handleExportJson = () => {
    const jsonStr = exportHistoryJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `moonlander-profile-${profile.callsign.toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const result = importHistoryJson(text);
        alert(`Imported ${result.imported} mission records (${result.skipped} duplicate/skipped).`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Filtered & Sorted History
  const filteredHistory = useMemo(() => {
    let list = [...history];

    if (historySearch) {
      const q = historySearch.toLowerCase();
      list = list.filter(
        (h) =>
          h.missionName.toLowerCase().includes(q) ||
          h.scenarioId.toLowerCase().includes(q) ||
          h.seed.toLowerCase().includes(q)
      );
    }

    if (scenarioFilter !== "all") {
      list = list.filter((h) => h.scenarioId === scenarioFilter);
    }

    if (gradeFilter !== "all") {
      list = list.filter((h) => h.grade === gradeFilter);
    }

    list.sort((a, b) => {
      let diff = 0;
      if (sortField === "date") {
        diff = new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      } else if (sortField === "score") {
        diff = b.score - a.score;
      } else if (sortField === "cost") {
        diff = a.costM - b.costM;
      }
      return sortAsc ? -diff : diff;
    });

    return list;
  }, [history, historySearch, scenarioFilter, gradeFilter, sortField, sortAsc]);

  // Filtered Achievements
  const filteredAchievements = useMemo(() => {
    if (achCategory === "all") return achievements;
    return achievements.filter((a) => a.category === achCategory);
  }, [achCategory]);

  const unlockedCount = profile.unlockedAchievementIds.length;
  const totalCount = achievements.length;
  const unlockPercent = Math.round((unlockedCount / totalCount) * 100);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-space-bg flex items-center justify-center p-6 text-telemetry-amber font-mono text-xs">
        INITIALIZING FLIGHT DOSSIER...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space-bg text-gray-200 flex flex-col">
      {/* Top Navigation Bar */}
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
            Pilot Dossier & Career Records
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDemoMode}
            className={`px-3 py-1 rounded text-[11px] font-heading font-bold uppercase tracking-wider border transition-all ${
              profile.demoModeUnlocked
                ? "bg-telemetry-amber/20 border-telemetry-amber text-telemetry-amber shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                : "border-space-border text-gray-400 hover:text-white hover:border-gray-500"
            }`}
          >
            {profile.demoModeUnlocked ? "Demo Mode: Active" : "Demo Mode: Locked"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Pilot Header Dossier Card */}
        <div className="p-6 rounded-2xl bg-space-surface border border-space-border/80 relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Avatar & Callsign */}
            <div className="lg:col-span-4 flex items-center gap-5">
              <PilotAvatar seed={profile.avatarSeed} rank={profile.currentRank} size={90} />

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {editingCallsign ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tempCallsign}
                        onChange={(e) => setTempCallsign(e.target.value)}
                        className="bg-black/60 border border-telemetry-amber text-white font-heading font-bold text-lg px-2 py-0.5 rounded w-36 uppercase"
                        autoFocus
                      />
                      <button onClick={handleSaveCallsign} className="p-1 text-telemetry-green hover:bg-white/10 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingCallsign(false)} className="p-1 text-telemetry-red hover:bg-white/10 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="font-heading font-black text-2xl uppercase tracking-wider text-white truncate">
                        {profile.callsign}
                      </h2>
                      <button
                        onClick={() => {
                          setTempCallsign(profile.callsign);
                          setEditingCallsign(true);
                        }}
                        className="text-gray-400 hover:text-telemetry-amber p-1 transition-colors"
                        title="Edit Callsign"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="amber" size="sm">
                    {profile.currentRank.toUpperCase()}
                  </Badge>
                  <span className="font-mono text-xs text-gray-400">
                    ID: {profile.id}
                  </span>
                </div>
              </div>
            </div>

            {/* XP Bar & Promotion Progress */}
            <div className="lg:col-span-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-300 font-heading uppercase tracking-wider">
                  Career XP: <strong className="text-telemetry-amber">{profile.xp.toLocaleString()} XP</strong>
                </span>
                <span className="text-gray-400">
                  {xpProgress.isMaxRank ? (
                    "Maximum Rank Attained"
                  ) : (
                    <span>Next: <strong>{xpProgress.xpToNext.toLocaleString()} XP</strong></span>
                  )}
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-3 rounded-full bg-black/60 border border-space-border/60 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-telemetry-cyan via-telemetry-amber to-telemetry-green transition-all duration-500 shadow-sm"
                  style={{ width: `${xpProgress.progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
                <span>{xpProgress.tierMin.toLocaleString()} XP</span>
                <span>{xpProgress.progressPercent}% to next promotion</span>
                <span>{xpProgress.tierMax ? `${xpProgress.tierMax.toLocaleString()} XP` : "MAX"}</span>
              </div>
            </div>

            {/* Quick Stat Counter */}
            <div className="lg:col-span-3 grid grid-cols-3 gap-2 text-center border-t lg:border-t-0 lg:border-l border-space-border/60 pt-4 lg:pt-0 lg:pl-6 font-mono">
              <div className="p-2 rounded bg-black/40">
                <span className="text-[10px] text-gray-400 font-heading uppercase block">Missions</span>
                <span className="text-lg font-bold text-white">{profile.stats.missionsFlown}</span>
              </div>
              <div className="p-2 rounded bg-black/40">
                <span className="text-[10px] text-gray-400 font-heading uppercase block">Successes</span>
                <span className="text-lg font-bold text-telemetry-green">{profile.stats.successCount}</span>
              </div>
              <div className="p-2 rounded bg-black/40">
                <span className="text-[10px] text-gray-400 font-heading uppercase block">Badges</span>
                <span className="text-lg font-bold text-telemetry-amber">{unlockedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-space-border pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-heading uppercase tracking-wider transition-all ${
                activeTab === "history"
                  ? "bg-telemetry-cyan/20 border border-telemetry-cyan text-telemetry-cyan font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Rocket className="w-4 h-4" />
              <span>Flight History ({history.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("achievements")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-heading uppercase tracking-wider transition-all ${
                activeTab === "achievements"
                  ? "bg-telemetry-amber/20 border border-telemetry-amber text-telemetry-amber font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Trophy Case ({unlockedCount}/{totalCount})</span>
            </button>

            <button
              onClick={() => setActiveTab("patches")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-heading uppercase tracking-wider transition-all ${
                activeTab === "patches"
                  ? "bg-purple-500/20 border border-purple-500 text-purple-400 font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Insignia Wall ({history.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("bests")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-heading uppercase tracking-wider transition-all ${
                activeTab === "bests"
                  ? "bg-telemetry-green/20 border border-telemetry-green text-telemetry-green font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Personal Bests</span>
            </button>
          </div>

          {/* Export / Import buttons */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 border border-space-border hover:border-gray-400 text-xs font-heading uppercase text-gray-300 hover:text-white transition-all"
              title="Import saved history JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 border border-space-border hover:border-gray-400 text-xs font-heading uppercase text-gray-300 hover:text-white transition-all"
              title="Export complete flight history JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* TAB 1: FLIGHT HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* History Table Filter Toolbar */}
            <div className="p-4 rounded-xl bg-space-surface border border-space-border flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search */}
                <div className="relative min-w-[200px] flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search missions..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full bg-black/50 border border-space-border rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-telemetry-cyan"
                  />
                </div>

                {/* Scenario Filter */}
                <select
                  value={scenarioFilter}
                  onChange={(e) => setScenarioFilter(e.target.value)}
                  className="bg-black/50 border border-space-border rounded-lg px-3 py-1.5 text-xs font-mono text-gray-300"
                >
                  <option value="all">All Scenarios</option>
                  <option value="earth-watch">Earth Watch</option>
                  <option value="fire-ice">Fire & Ice</option>
                  <option value="geo-relay">GEO Relay</option>
                  <option value="sun-sentinel">Space Weather Sentinel</option>
                  <option value="exoplanet-hunter">Exoplanet Transit</option>
                  <option value="lunar-pathfinder">Lunar Pathfinder</option>
                  <option value="mars-relay">Mars Relay</option>
                  <option value="ocean-world">Ocean World</option>
                </select>

                {/* Grade Filter */}
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="bg-black/50 border border-space-border rounded-lg px-3 py-1.5 text-xs font-mono text-gray-300"
                >
                  <option value="all">All Grades</option>
                  <option value="S">Grade S</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                  <option value="D">Grade D</option>
                </select>
              </div>

              {/* Compare Bar */}
              {selectedForCompare.length > 0 && (
                <div className="flex items-center gap-2 bg-telemetry-amber/10 border border-telemetry-amber/40 px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-mono text-telemetry-amber">
                    {selectedForCompare.length}/2 selected
                  </span>
                  <button
                    disabled={selectedForCompare.length !== 2}
                    onClick={() => setShowCompareModal(true)}
                    className="px-3 py-1 rounded bg-telemetry-amber text-black font-heading font-bold text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-telemetry-amber/90 transition-colors"
                  >
                    Compare Side-by-Side
                  </button>
                  <button
                    onClick={() => setSelectedForCompare([])}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* History Table */}
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-space-surface border border-space-border space-y-3">
                <Rocket className="w-8 h-8 text-gray-600 mx-auto" />
                <h3 className="font-heading uppercase text-sm font-bold text-gray-400">
                  No Mission Records Found
                </h3>
                <p className="font-mono text-xs text-gray-500 max-w-sm mx-auto">
                  Complete your first spacecraft design and flight operations simulation to log flight records.
                </p>
                <Link
                  href="/mission/earth-watch"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-telemetry-cyan text-black font-heading font-bold text-xs uppercase tracking-wider hover:bg-telemetry-cyan/90 transition-colors mt-2"
                >
                  Launch First Mission
                </Link>
              </div>
            ) : (
              <div className="rounded-xl bg-space-surface border border-space-border overflow-hidden">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-black/60 text-gray-400 uppercase font-heading text-[11px] border-b border-space-border">
                    <tr>
                      <th className="p-3 w-10 text-center">Compare</th>
                      <th className="p-3">Mission & Scenario</th>
                      <th className="p-3 cursor-pointer" onClick={() => { setSortField("score"); setSortAsc(!sortAsc); }}>
                        <div className="flex items-center gap-1">
                          <span>Score</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="p-3">Grade</th>
                      <th className="p-3 cursor-pointer" onClick={() => { setSortField("cost"); setSortAsc(!sortAsc); }}>
                        <div className="flex items-center gap-1">
                          <span>Cost</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="p-3">Mass</th>
                      <th className="p-3">Orbit</th>
                      <th className="p-3 cursor-pointer" onClick={() => { setSortField("date"); setSortAsc(!sortAsc); }}>
                        <div className="flex items-center gap-1">
                          <span>Date</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-space-border/40">
                    {filteredHistory.map((rec) => {
                      const isChecked = selectedForCompare.includes(rec.id);
                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => setSelectedRecord(rec)}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCompareSelection(rec.id)}
                              className="rounded border-space-border bg-black/60 text-telemetry-amber focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <span className="font-heading font-bold text-white block text-sm">
                              {rec.missionName}
                            </span>
                            <span className="text-[11px] text-telemetry-cyan uppercase">
                              {rec.scenarioId} &bull; {rec.seed}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-white text-sm">
                            {rec.score}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                rec.grade === "S"
                                  ? "amber"
                                  : rec.grade === "A"
                                  ? "nominal"
                                  : rec.grade === "B"
                                  ? "info"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {rec.grade}
                            </Badge>
                          </td>
                          <td className="p-3 text-gray-300">
                            ${rec.costM.toFixed(1)}M
                          </td>
                          <td className="p-3 text-gray-300">
                            {rec.massKg.toFixed(1)} kg
                          </td>
                          <td className="p-3 text-telemetry-amber uppercase">
                            {rec.orbitId}
                          </td>
                          <td className="p-3 text-gray-400 text-[11px]">
                            {new Date(rec.completedAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedRecord(rec)}
                              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-heading uppercase text-[10px] tracking-wider transition-colors"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TROPHY CASE (ACHIEVEMENTS) */}
        {activeTab === "achievements" && (
          <div className="space-y-6">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "All Achievements" },
                { id: "first-flight", label: "First Flight" },
                { id: "engineering", label: "Engineering" },
                { id: "efficiency", label: "Efficiency" },
                { id: "survival", label: "Survival" },
                { id: "exploration", label: "Exploration" },
                { id: "learning", label: "Learning" },
                { id: "operations", label: "Operations" },
                { id: "story", label: "Story" },
                { id: "mastery", label: "Mastery" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setAchCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-heading uppercase tracking-wider transition-all ${
                    achCategory === cat.id
                      ? "bg-telemetry-amber text-black font-bold"
                      : "bg-space-surface border border-space-border text-gray-400 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((ach) => {
                const isUnlocked = profile.unlockedAchievementIds.includes(ach.id);

                return (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isUnlocked
                        ? "bg-space-surface border-telemetry-amber/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                        : "bg-space-surface/40 border-space-border/40 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                          isUnlocked
                            ? "bg-telemetry-amber/20 border-telemetry-amber text-telemetry-amber"
                            : "bg-black/50 border-space-border text-gray-600"
                        }`}
                      >
                        {isUnlocked ? (
                          <Trophy className="w-5 h-5" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-heading font-bold uppercase text-sm text-white truncate">
                            {ach.secret && !isUnlocked ? "CLASSIFIED DIRECTIVE" : ach.title}
                          </h4>
                          <span className="font-mono text-[10px] text-telemetry-amber shrink-0">
                            +{ach.xp} XP
                          </span>
                        </div>

                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                          {ach.secret && !isUnlocked
                            ? "Classified mission objective. Complete exploration milestones to decrypt."
                            : ach.description}
                        </p>

                        <div className="flex items-center justify-between pt-1 font-mono text-[10px]">
                          <Badge
                            variant={
                              ach.tier === "platinum" || ach.tier === "gold"
                                ? "amber"
                                : ach.tier === "silver"
                                ? "info"
                                : "neutral"
                            }
                            size="sm"
                          >
                            {ach.tier.toUpperCase()}
                          </Badge>
                          <span className="text-gray-500">
                            {isUnlocked ? "UNLOCKED" : ach.unlockRequirement}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: INSIGNIA PATCH WALL */}
        {activeTab === "patches" && (
          <div className="space-y-4">
            <p className="font-mono text-xs text-gray-400">
              Procedurally generated embroidered flight insignia patches minted upon mission debrief completion.
            </p>

            {history.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-space-surface border border-space-border">
                <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <span className="font-heading uppercase text-xs text-gray-400">
                  No Patches Earned Yet
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {history.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecord(rec)}
                    className="p-3 rounded-xl bg-space-surface border border-space-border/60 hover:border-telemetry-amber/80 transition-all flex flex-col items-center cursor-pointer group shadow-lg"
                  >
                    <div className="transform group-hover:scale-105 transition-transform">
                      <MissionPatch
                        missionName={rec.missionName}
                        scenarioId={rec.scenarioId}
                        seed={rec.seed}
                        grade={rec.grade}
                        size={120}
                        showDownload={false}
                      />
                    </div>
                    <span className="font-heading font-bold text-xs uppercase text-white mt-3 text-center truncate w-full">
                      {rec.missionName}
                    </span>
                    <span className="font-mono text-[10px] text-telemetry-amber">
                      Grade {rec.grade} &bull; {rec.score} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PERSONAL BESTS MATRIX */}
        {activeTab === "bests" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: "earth-watch", name: "Earth Watch (Polar LEO)" },
              { id: "fire-ice", name: "Fire & Ice (SSO Wildfire)" },
              { id: "geo-relay", name: "GEO Communications Relay" },
              { id: "sun-sentinel", name: "Space Weather Sentinel (L1)" },
              { id: "exoplanet-hunter", name: "Exoplanet Transit Hunter" },
              { id: "lunar-pathfinder", name: "Lunar Pathfinder" },
              { id: "mars-relay", name: "Mars Communications Relay" },
              { id: "ocean-world", name: "Ocean World Explorer (Europa)" },
            ].map((scen) => {
              const best = profile.personalBests[scen.id];

              return (
                <div key={scen.id} className="p-4 rounded-xl bg-space-surface border border-space-border space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold uppercase text-sm text-white">
                      {scen.name}
                    </h4>
                    {best && (
                      <Badge variant={best.bestGrade === "S" ? "amber" : "nominal"} size="sm">
                        GRADE {best.bestGrade}
                      </Badge>
                    )}
                  </div>

                  {best ? (
                    <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1 border-t border-space-border/40">
                      <div>
                        <span className="text-[10px] text-gray-500 font-heading uppercase block">High Score</span>
                        <span className="font-bold text-telemetry-green text-sm">{best.bestScore}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-heading uppercase block">Low Cost</span>
                        <span className="font-bold text-white text-sm">${best.lowestCostM.toFixed(1)}M</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-heading uppercase block">Flown</span>
                        <span className="font-bold text-telemetry-amber text-sm">{best.completedCount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center rounded bg-black/30 border border-dashed border-space-border/40 font-mono text-xs text-gray-500">
                      No flights completed
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedRecord && (
        <MissionDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onDelete={(id) => deleteHistoryRecord(id)}
        />
      )}

      {showCompareModal && selectedForCompare.length === 2 && (
        <MissionCompareModal
          missionA={history.find((h) => h.id === selectedForCompare[0])!}
          missionB={history.find((h) => h.id === selectedForCompare[1])!}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
}
