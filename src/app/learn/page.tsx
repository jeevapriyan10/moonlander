"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Search,
  Tag,
  Calculator,
  Compass,
  Zap,
  Flame,
  Radio,
  ThermometerSnowflake,
  ShieldAlert,
} from "lucide-react";
import { glossary } from "@/data";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";

const CATEGORY_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  all: { label: "All Topics", icon: <BookOpen className="w-3.5 h-3.5" /> },
  astrodynamics: { label: "Astrodynamics", icon: <Compass className="w-3.5 h-3.5" /> },
  propulsion: { label: "Propulsion", icon: <Flame className="w-3.5 h-3.5" /> },
  power: { label: "Power & Energy", icon: <Zap className="w-3.5 h-3.5" /> },
  comms: { label: "Communications", icon: <Radio className="w-3.5 h-3.5" /> },
  thermal: { label: "Thermal & Radiation", icon: <ThermometerSnowflake className="w-3.5 h-3.5" /> },
  systems: { label: "Systems Engineering", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
};

export default function LearnPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredTerms = useMemo(() => {
    return glossary.filter((item) => {
      const matchesSearch =
        item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shortDefinition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.fullExplanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-space-bg flex flex-col justify-between p-4 sm:p-8">
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto pb-6 border-b border-space-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-space-panel"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO FLIGHT OPS</span>
          </Link>
          <span className="text-space-border">/</span>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-telemetry-amber" />
            <h1 className="font-heading uppercase tracking-widest text-lg text-white">
              ORBITAL SYSTEMS LEXICON
            </h1>
          </div>
        </div>

        <div className="font-mono text-xs text-slate-400">
          INDEXED: <span className="text-telemetry-cyan font-bold">{glossary.length}</span> CANONICAL FORMULAS & DEFINITIONS
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto my-8 flex-1">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search equations, parameters (e.g. delta-v, TRL, J2, DOD)..."
              className="w-full pl-9 pr-4 py-2 rounded bg-space-panel border border-space-border text-xs font-mono text-white placeholder-slate-500 focus:border-telemetry-amber focus:outline-none"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {Object.entries(CATEGORY_MAP).map(([catKey, { label, icon }]) => (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-heading text-xs tracking-wider uppercase transition-colors ${
                  selectedCategory === catKey
                    ? "bg-telemetry-amber text-space-950 font-bold border border-telemetry-amber"
                    : "bg-space-panel border border-space-border text-slate-400 hover:text-white"
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="text-xs font-mono text-slate-400 mb-4 flex items-center justify-between">
          <span>MATCHES: {filteredTerms.length} OF {glossary.length}</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-telemetry-amber hover:underline"
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Term Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTerms.map((item) => (
            <div
              key={item.id}
              id={item.id}
              className="p-5 rounded-lg border border-space-border bg-space-panel flex flex-col justify-between hover:border-space-border-active transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-lg font-heading uppercase font-bold text-white tracking-wide">
                    {item.term}
                  </h2>
                  <Badge variant="outline" className="uppercase text-[10px]">
                    {item.category}
                  </Badge>
                </div>

                <p className="text-xs font-medium text-telemetry-cyan font-mono mb-3">
                  {item.shortDefinition}
                </p>

                <p className="text-xs text-slate-300 font-body leading-relaxed mb-4">
                  {item.fullExplanation}
                </p>
              </div>

              {item.formula && (
                <div className="mt-2 pt-3 border-t border-space-border/60 flex items-center justify-between bg-space-bg/50 p-2.5 rounded border border-space-border/40 font-mono text-xs">
                  <div className="flex items-center gap-2 text-telemetry-amber">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>FORMULA:</span>
                  </div>
                  <code className="text-slate-100 font-semibold tracking-wider">
                    {item.formula}
                  </code>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-space-border flex items-center justify-between text-xs font-mono text-slate-500">
        <span>MISSIONFORGE // ASTRODYNAMICS & SYSTEMS ENGINEERING COMPENDIUM</span>
        <Link href="/" className="text-telemetry-cyan hover:underline">
          Back to Command Center →
        </Link>
      </footer>
    </div>
  );
}
