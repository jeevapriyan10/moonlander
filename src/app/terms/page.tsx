"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function TermsOfServicePage() {
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
            MoonLander // Terms of Service
          </h1>
        </div>
        <Badge variant="amber" size="sm">
          OPEN EDUCATIONAL PLATFORM
        </Badge>
      </header>

      {/* Main Dossier */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-8 font-mono text-xs">
        <div className="space-y-2 border-b border-space-border pb-6">
          <Badge variant="info" size="sm">
            USER TERMS
          </Badge>
          <h2 className="font-heading font-black text-3xl md:text-4xl uppercase tracking-wider text-white">
            Terms of Use &amp; Simulation Software Agreement
          </h2>
          <p className="text-slate-400 leading-relaxed">
            By accessing or playing MoonLander, you agree to these simple and transparent community guidelines.
          </p>
        </div>

        <section className="space-y-4">
          <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-3 text-slate-300">
            <h3 className="font-heading uppercase text-white font-bold text-sm">1. Educational &amp; Entertainment Purpose</h3>
            <p className="leading-relaxed">
              MoonLander is an educational simulation game designed to teach orbital mechanics, aerospace systems engineering, and planetary powered descent. While its mathematical integrators, ephemerides, and rocket equations are derived from real aerospace literature, the software is provided strictly for educational and entertainment purposes and must not be used for actual real-world flight operations or life-critical applications.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-3 text-slate-300">
            <h3 className="font-heading uppercase text-white font-bold text-sm">2. Fair Play &amp; Leaderboard Integrity</h3>
            <p className="leading-relaxed">
              Leaderboard submissions are verified server-side using deterministic simulation replay checks. We ask all pilots to compete fairly. Submission of artificially forged telemetry payloads or exploiting unauthorized endpoints is prohibited and will result in score disqualification.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-3 text-slate-300">
            <h3 className="font-heading uppercase text-white font-bold text-sm">3. License &amp; Open Source</h3>
            <p className="leading-relaxed">
              The MoonLander software and source code are released under the open MIT License. Third-party planetary maps, celestial textures, and astrodynamic algorithms remain the property of their respective open-access and public domain contributors (see Citations &amp; Credits).
            </p>
          </div>

          <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-3 text-slate-300">
            <h3 className="font-heading uppercase text-white font-bold text-sm">4. No Agency Endorsement</h3>
            <p className="leading-relaxed">
              MoonLander is an independent project. References to historic or contemporary missions by NASA, ESA, JAXA, ISRO, or other space agencies do not imply sponsorship, affiliation, or endorsement by those agencies.
            </p>
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
