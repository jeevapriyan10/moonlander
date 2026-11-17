"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LunarDescentReplay } from "@/components/replay/LunarDescentReplay";
import {
  type ReplayLog,
  deriveLanderConfig,
} from "@/engine/lander";
import { ArrowLeft, Play, History, RotateCcw, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const apolloConfig = deriveLanderConfig("bus-medium", "prop-descent-throttleable", "adcs-reaction-wheels", ["inst-landing-radar"], 1400, 1800, "moon").config;
const surveyorConfig = deriveLanderConfig("bus-small", "prop-descent-throttleable", "adcs-cold-gas", ["inst-landing-radar"], 800, 1100, "moon").config;

// Historic Benchmark Replays
const BENCHMARK_REPLAYS: Record<string, ReplayLog> = {
  apollo11: {
    version: 1,
    seed: "apollo-11-tranquility-nominal",
    siteId: "apollo-11",
    body: "moon",
    assist: "autopilot",
    config: apolloConfig,
    frames: [],
  },
  chandrayaan3: {
    version: 1,
    seed: "chandrayaan-3-shiv-shakti-polar",
    siteId: "chandrayaan-3",
    body: "moon",
    assist: "autopilot",
    config: surveyorConfig,
    frames: [],
  },
  change4: {
    version: 1,
    seed: "change-4-farside-von-karman",
    siteId: "change-4",
    body: "moon",
    assist: "autopilot",
    config: apolloConfig,
    frames: [],
  },
};

export default function ReplayViewerPage() {
  const [selectedKey, setSelectedKey] = useState<string>("apollo11");

  const currentReplay = BENCHMARK_REPLAYS[selectedKey] || BENCHMARK_REPLAYS.apollo11!;

  return (
    <div className="min-h-screen bg-space-bg flex flex-col p-4 md:p-8 font-mono text-slate-200">
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-6">
        {/* Header */}
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
                STAGE 3 // DESCENT TELEMETRY RECORDER
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-heading uppercase tracking-widest text-white font-bold">
              Powered Descent Replay Vault
            </h1>
            <p className="text-xs text-gray-400">
              Deterministic 120Hz trajectory replay with timeline scrub, hazard tracking, and velocity vectors.
            </p>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-space-border">
            <button
              onClick={() => setSelectedKey("apollo11")}
              className={`px-3 py-1 rounded text-xs uppercase font-heading font-semibold transition-all ${
                selectedKey === "apollo11"
                  ? "bg-telemetry-amber text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Apollo 11
            </button>
            <button
              onClick={() => setSelectedKey("chandrayaan3")}
              className={`px-3 py-1 rounded text-xs uppercase font-heading font-semibold transition-all ${
                selectedKey === "chandrayaan3"
                  ? "bg-telemetry-cyan text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Chandrayaan-3
            </button>
            <button
              onClick={() => setSelectedKey("change4")}
              className={`px-3 py-1 rounded text-xs uppercase font-heading font-semibold transition-all ${
                selectedKey === "change4"
                  ? "bg-telemetry-green text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Chang&apos;e 4
            </button>
          </div>
        </div>

        {/* Main Replay Visualizer */}
        <LunarDescentReplay
          key={selectedKey}
          log={currentReplay}
          className="w-full"
        />
      </div>
    </div>
  );
}
