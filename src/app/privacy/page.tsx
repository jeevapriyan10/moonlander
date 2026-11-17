"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Trash2, CheckCircle2, Lock, Database } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function PrivacyPolicyPage() {
  const [cleared, setCleared] = useState(false);

  const handleClearLocalData = () => {
    if (typeof window !== "undefined") {
      if (confirm("Are you sure you want to delete all local mission designs, telemetry, and pilot dossiers?")) {
        const keysToRemove = Object.keys(localStorage).filter(
          (k) => k.startsWith("moonlander:") || k.startsWith("missionforge:")
        );
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        setCleared(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    }
  };

  return (
    <div className="min-h-screen bg-space-bg text-slate-200 flex flex-col font-body">
      {/* Top Header */}
      <header className="h-14 border-b border-space-border bg-space-panel/80 backdrop-blur px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-heading uppercase text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Flight Deck</span>
          </Link>
          <span className="text-gray-600">/</span>
          <h1 className="font-heading font-extrabold text-sm uppercase tracking-wider text-white">
            MoonLander // Privacy Policy
          </h1>
        </div>
        <Badge variant="info" size="sm">
          USER PRIVACY & DATA ETHICS
        </Badge>
      </header>

      {/* Main Dossier */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-8 font-mono text-xs">
        <div className="space-y-2 border-b border-space-border pb-6">
          <Badge variant="amber" size="sm">
            DATA TRANSPARENCY
          </Badge>
          <h2 className="font-heading font-black text-3xl md:text-4xl uppercase tracking-wider text-white">
            Telemetry & Account Privacy Guarantee
          </h2>
          <p className="text-slate-400 leading-relaxed">
            MoonLander is designed around zero-friction guest play and strict data minimization. We only store what is required to track your aerospace campaign progress and provide leaderboard rankings.
          </p>
        </div>

        {/* Section 1: What We Store */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-telemetry-cyan font-heading uppercase tracking-wider font-bold text-base">
            <Database className="w-4 h-4" />
            <h3>1. What Information Is Collected &amp; Stored</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-2">
              <h4 className="font-heading uppercase text-white font-bold text-sm">Guest Mode (Local Storage Only)</h4>
              <p className="text-slate-400 leading-relaxed">
                If you play as a guest without signing in, <strong>100% of your data remains strictly on your device</strong> in browser <code className="text-telemetry-amber">localStorage</code>. This includes spacecraft design configurations, debrief scores, lesson completions, and rank XP.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-2">
              <h4 className="font-heading uppercase text-white font-bold text-sm">Authenticated Cloud Sync</h4>
              <p className="text-slate-400 leading-relaxed">
                When you sign in using our passwordless pure email authentication, our Supabase backend stores:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Your email address (used strictly for login links)</li>
                <li>Your chosen pilot callsign and avatar seed</li>
                <li>Your mission designs and campaign chapter unlocks</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Public vs Private Visibility */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-telemetry-green font-heading uppercase tracking-wider font-bold text-base">
            <Lock className="w-4 h-4" />
            <h3>2. Public vs. Private Information</h3>
          </div>

          <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-3 text-slate-300">
            <p>
              To protect pilot privacy on global and daily leaderboards, <strong>only your callsign and avatar seed are publicly visible</strong> alongside verified mission scores.
            </p>
            <div className="flex flex-col gap-2 pt-1 border-t border-space-border/60 text-[11px]">
              <div className="flex items-center gap-2 text-telemetry-green">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Your email address is NEVER shared with other pilots or included in API responses.</span>
              </div>
              <div className="flex items-center gap-2 text-telemetry-green">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Database Row Level Security (RLS) strictly prevents any pilot from modifying another pilot&apos;s designs.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Data Deletion & Export */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-telemetry-orange font-heading uppercase tracking-wider font-bold text-base">
            <Trash2 className="w-4 h-4" />
            <h3>3. Data Deletion &amp; Pilot Rights</h3>
          </div>

          <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-4 text-slate-300">
            <p>
              You have the right to inspect, export, or completely delete your mission data at any time. You can export your mission dossiers as JSON from the Debrief stage or Pilot Dossier page.
            </p>

            <div className="pt-2 border-t border-space-border/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="font-bold text-white block">Purge Local Browser Telemetry</span>
                <span className="text-[11px] text-gray-400">
                  Instantly wipes all locally cached mission blueprints, flight history, and settings from this device.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearLocalData}
                disabled={cleared}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 shrink-0"
              >
                {cleared ? "Telemetry Purged! Redirecting..." : "Purge Local Telemetry"}
              </Button>
            </div>
          </div>
        </section>

        <div className="text-center pt-6 border-t border-space-border/60">
          <Link href="/">
            <span className="font-heading uppercase text-xs text-telemetry-amber hover:underline tracking-wider cursor-pointer">
              Return to MoonLander Flight Ops
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
