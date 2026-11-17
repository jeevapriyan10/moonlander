"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Cpu, ShieldCheck, CheckCircle2, Code2, Sparkles, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function AiDisclosurePage() {
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
            MoonLander // AI &amp; SI Assistance Disclosure
          </h1>
        </div>
        <Badge variant="info" size="sm">
          SYNTHETIC INTELLIGENCE DISCLOSURE
        </Badge>
      </header>

      {/* Main Dossier */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-8 font-mono text-xs">
        <div className="space-y-2 border-b border-space-border pb-6">
          <Badge variant="amber" size="sm">
            NASA SPACE APPS COMPLIANCE
          </Badge>
          <h2 className="font-heading font-black text-3xl md:text-4xl uppercase tracking-wider text-white">
            Synthetic Intelligence (SI) Architecture Disclosure
          </h2>
          <p className="text-slate-400 leading-relaxed">
            In full compliance with open-source engineering standards and the NASA International Space Apps Challenge rules on artificial intelligence transparency, this document discloses how Synthetic Intelligence (SI) and AI tools were utilized in the creation of MoonLander.
          </p>
        </div>

        {/* Section 1: Disclosure Statement */}
        <section className="space-y-4">
          <div className="p-4 rounded-xl border border-telemetry-purple/40 bg-telemetry-purple/10 space-y-3 text-slate-200">
            <div className="flex items-center gap-2 text-telemetry-purple font-bold text-sm uppercase">
              <Cpu className="w-4 h-4" />
              <span>Statement of AI-Assisted Authorship</span>
            </div>
            <p className="leading-relaxed">
              <strong>MoonLander was engineered with AI / Synthetic Intelligence (SI) assistance</strong> across code generation, astrodynamic calculation verification, procedural audio digital signal processing (DSP), educational content synthesis, and documentation authorship.
            </p>
          </div>
        </section>

        {/* Section 2: Domains of AI Application */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-telemetry-cyan font-heading uppercase tracking-wider font-bold text-base">
            <Code2 className="w-4 h-4" />
            <span>1. Domains of SI / AI Assistance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-2">
              <h4 className="font-heading uppercase text-white font-bold text-sm">Deterministic Physics &amp; Integrators</h4>
              <p className="text-slate-400 leading-relaxed">
                Assisted in the mathematical translation of Keplerian ephemeris elements (Standish 1992), Battin-Vaughn Lambert targeters, and 120 Hz semi-implicit Euler powered-descent physics routines.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-2">
              <h4 className="font-heading uppercase text-white font-bold text-sm">Procedural Web Audio DSP</h4>
              <p className="text-slate-400 leading-relaxed">
                Assisted in the pure synthesis algorithms for real-time audio (bandpass noise buffers for radio squelch, biquad filter frequency ramps for thruster rumble, and ambient Dorian generative chime sequencing).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-2">
              <h4 className="font-heading uppercase text-white font-bold text-sm">Data Curation &amp; Schema Validation</h4>
              <p className="text-slate-400 leading-relaxed">
                Assisted in drafting strictly typed Zod schemas for subsystems (buses, launchers, instruments, orbits, and campaign chapters) and compiling peer-reviewed SMAD / AIAA engineering formulas.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-2">
              <h4 className="font-heading uppercase text-white font-bold text-sm">Campaign Dialogue &amp; Codex</h4>
              <p className="text-slate-400 leading-relaxed">
                Assisted in authoring the Meridian Space Authority narrative arc, educational Space Academy lesson modules, and procedural pilot debrief causal analysis engine.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Intellectual Property & Originality */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-telemetry-green font-heading uppercase tracking-wider font-bold text-base">
            <ShieldCheck className="w-4 h-4" />
            <span>2. Intellectual Property, Logos &amp; Trademarks</span>
          </div>

          <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-3 text-slate-300">
            <div className="flex items-center gap-2 text-telemetry-green">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span><strong>Zero NASA Logos or Flags:</strong> No restricted agency logos, insignia, flags, or trademarked visual assets are used in the application.</span>
            </div>
            <div className="flex items-center gap-2 text-telemetry-green">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span><strong>100% Original Procedural Patches:</strong> All mission insignias and campaign achievement badges are algorithmically generated vector SVGs.</span>
            </div>
            <div className="flex items-center gap-2 text-telemetry-green">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span><strong>Source Metadata &amp; Annotations:</strong> Core source and data files include attribution metadata (<code className="text-telemetry-amber">aiAssisted: true</code>) acknowledging AI-assisted authoring.</span>
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
