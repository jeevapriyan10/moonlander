"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Search,
  Compass,
  Cpu,
  Zap,
  Globe,
  Radio,
  Calculator,
  ExternalLink,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Hash,
  Share2,
} from "lucide-react";
import { codex, type CodexEntry } from "@/data";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { useSettingsStore } from "@/store/settings";

type CategoryKey = "all" | "subsystems" | "orbits" | "environment" | "operations" | "real-missions" | "physics";

const CATEGORY_MAP: Record<CategoryKey, { label: string; icon: React.ReactNode }> = {
  all: { label: "All Topics", icon: <BookOpen className="w-3.5 h-3.5" /> },
  subsystems: { label: "Subsystems", icon: <Cpu className="w-3.5 h-3.5" /> },
  orbits: { label: "Orbits & Trajectories", icon: <Compass className="w-3.5 h-3.5" /> },
  environment: { label: "Space Environment", icon: <Zap className="w-3.5 h-3.5" /> },
  operations: { label: "Mission Operations", icon: <Radio className="w-3.5 h-3.5" /> },
  "real-missions": { label: "Real Missions", icon: <Globe className="w-3.5 h-3.5" /> },
  physics: { label: "Math & Physics", icon: <Calculator className="w-3.5 h-3.5" /> },
};

export default function CodexPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");
  const [activeHash, setActiveHash] = useState("");
  const { plainLanguage, setPlainLanguage } = useSettingsStore();

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setActiveHash(hash);
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return codex.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.plainLanguageName && item.plainLanguageName.toLowerCase().includes(query)) ||
        item.summary.toLowerCase().includes(query) ||
        item.technicalDefinition.toLowerCase().includes(query) ||
        item.historicalExample.toLowerCase().includes(query) ||
        item.gameplayImpact.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-space-bg flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header Bar */}
      <header className="max-w-6xl w-full mx-auto pb-6 border-b border-space-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-space-panel"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO FLIGHT OPS</span>
          </Link>
          <span className="text-space-border">/</span>
          <Wordmark size="sm" asLink={false} />
          <span className="text-space-border">/</span>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-telemetry-amber" />
            <h1 className="font-heading uppercase tracking-widest text-lg text-white">
              SPACE CODEX
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <button
            type="button"
            onClick={() => setPlainLanguage(!plainLanguage)}
            className="flex items-center gap-2 px-2.5 py-1 rounded border border-space-border hover:border-telemetry-cyan bg-space-panel text-slate-300 hover:text-white transition-colors"
            title="Toggle between Engineering Technical Jargon and Plain-English Names"
          >
            <Sparkles className="w-3.5 h-3.5 text-telemetry-cyan" />
            <span>PLAIN ENGLISH:</span>
            <span className={plainLanguage ? "text-telemetry-green font-bold" : "text-slate-500 font-bold"}>
              {plainLanguage ? "ACTIVE" : "OFF"}
            </span>
          </button>

          <span className="text-slate-500 hidden md:inline">|</span>

          <span className="text-slate-400 hidden md:inline">
            INDEXED: <strong className="text-telemetry-amber">{codex.length}</strong> VERIFIED ENTRIES
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto my-8 flex-1">
        {/* Search Input & Category Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 90+ space concepts, subsystems, formulas, real missions (e.g. ADCS, Delta-V, Kepler, SSO, SEU)..."
              className="w-full pl-10 pr-4 py-2.5 rounded bg-space-panel border border-space-border text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:border-telemetry-amber focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-white"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(CATEGORY_MAP) as CategoryKey[]).map((catKey) => {
              const { label, icon } = CATEGORY_MAP[catKey];
              const count = catKey === "all" ? codex.length : codex.filter((e) => e.category === catKey).length;
              const isSelected = selectedCategory === catKey;

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-heading text-xs tracking-wider uppercase transition-colors ${
                    isSelected
                      ? "bg-telemetry-amber text-black font-bold shadow-glow-amber"
                      : "bg-space-panel border border-space-border text-slate-300 hover:text-white hover:border-slate-500"
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                  <span className={`text-[10px] ml-0.5 ${isSelected ? "text-black/80" : "text-slate-500"}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count & Current Filter */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-4 px-1">
          <span>
            SHOWING <strong className="text-white">{filteredEntries.length}</strong> OF {codex.length} TOPICS
          </span>
          {activeHash && (
            <span className="text-telemetry-amber flex items-center gap-1">
              <Hash className="w-3 h-3" />
              TARGET: #{activeHash}
            </span>
          )}
        </div>

        {/* Grid of Entries */}
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-space-border rounded bg-space-panel/40">
            <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <p className="font-heading uppercase tracking-wider text-sm text-slate-300 mb-1">
              No matching codex entries found
            </p>
            <p className="text-xs font-mono text-slate-500 mb-4">
              Try searching a broader term like &quot;orbit&quot;, &quot;battery&quot;, &quot;propulsion&quot;, or &quot;radiation&quot;.
            </p>
            <Button size="sm" variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
              Reset Search Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEntries.map((item) => {
              const isTargeted = activeHash === item.id;

              return (
                <Panel
                  key={item.id}
                  id={item.id}
                  className={`transition-all duration-300 ${
                    isTargeted ? "ring-2 ring-telemetry-amber bg-space-panel/95" : ""
                  }`}
                >
                  <div className="flex flex-col gap-3 h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-space-border pb-2.5 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading uppercase text-sm tracking-wider text-white font-bold">
                            {plainLanguage && item.plainLanguageName ? item.plainLanguageName : item.name}
                          </h3>
                          <a
                            href={`#${item.id}`}
                            className="text-slate-500 hover:text-telemetry-amber transition-colors"
                            title="Direct link to this entry"
                          >
                            <Hash className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {plainLanguage && item.plainLanguageName && (
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            Tech Designation: <span className="text-telemetry-amber">{item.name}</span>
                          </div>
                        )}
                        {!plainLanguage && item.plainLanguageName && (
                          <div className="text-[11px] font-mono text-telemetry-cyan mt-0.5 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            Plain English: <span>{item.plainLanguageName}</span>
                          </div>
                        )}
                      </div>

                      <Badge variant="info" size="sm" className="uppercase text-[10px] shrink-0">
                        {item.category}
                      </Badge>
                    </div>

                    {/* Summary */}
                    <p className="text-xs font-body text-slate-200 leading-relaxed font-medium">
                      {item.summary}
                    </p>

                    {/* Technical Definition */}
                    <p className="text-xs font-mono text-slate-400 leading-relaxed bg-black/30 p-2.5 rounded border border-space-border/50">
                      {item.technicalDefinition}
                    </p>

                    {/* Formula */}
                    {item.formula && (
                      <div className="px-3 py-1.5 rounded bg-black/60 border border-space-border/80 text-center font-mono text-xs text-telemetry-cyan">
                        <code>{item.formula}</code>
                      </div>
                    )}

                    {/* Mission Impact Callout */}
                    <div className="p-2.5 rounded bg-space-bg/80 border border-space-border/70 text-xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-telemetry-amber mb-1 font-semibold">
                        <Sparkles className="w-3 h-3 text-telemetry-amber" />
                        <span>MoonLander Mission Impact</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        {item.gameplayImpact}
                      </p>
                    </div>

                    {/* Historical Flight Example */}
                    <div className="text-[11px] font-mono text-slate-400 border-l-2 border-telemetry-cyan/50 pl-2.5 py-0.5">
                      <strong className="text-slate-300">Flight Record: </strong>
                      {item.historicalExample}
                    </div>

                    {/* Related Topics & External Link */}
                    <div className="mt-auto pt-2.5 border-t border-space-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] font-mono">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-slate-500">Related:</span>
                        {item.relatedIds.map((relId) => {
                          const relItem = codex.find((c) => c.id === relId);
                          return (
                            <a
                              key={relId}
                              href={`#${relId}`}
                              className="px-1.5 py-0.5 rounded bg-space-panel border border-space-border text-slate-300 hover:text-telemetry-amber hover:border-telemetry-amber transition-colors"
                            >
                              {relItem ? (plainLanguage && relItem.plainLanguageName ? relItem.plainLanguageName : relItem.name) : relId}
                            </a>
                          );
                        })}
                      </div>

                      {item.externalUrl && (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-telemetry-cyan hover:underline flex items-center gap-1 shrink-0"
                        >
                          <span>NASA Documentation</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer Bar */}
      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-space-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <div>MOONLANDER SPACE CODEX — STAGE 2 AEROSPACE COMPILATION</div>
        <div className="flex items-center gap-3">
          <Link href="/academy" className="text-telemetry-amber hover:underline">
            SPACE ACADEMY
          </Link>
          <span>•</span>
          <Link href="/sandbox" className="text-telemetry-cyan hover:underline">
            SANDBOX STUDIO
          </Link>
        </div>
      </footer>
    </div>
  );
}
