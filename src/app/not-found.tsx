"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-space-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded border border-space-border bg-space-panel/90 backdrop-blur-md shadow-2xl flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-telemetry-amber/10 border-2 border-telemetry-amber flex items-center justify-center shadow-glow-amber">
          <AlertTriangle className="w-8 h-8 text-telemetry-amber" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-telemetry-amber uppercase tracking-widest">
            ERROR 404 // SIGNAL LOSS
          </span>
          <h1 className="text-2xl font-heading uppercase tracking-widest text-white font-bold">
            Target Locus Not Found
          </h1>
        </div>

        <p className="text-xs font-mono text-gray-400 leading-relaxed">
          The requested mission coordinates or telemetry stream do not exist in the ground network directory.
        </p>

        <Link
          href="/"
          className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded bg-telemetry-amber text-black font-heading font-bold text-xs uppercase tracking-wider hover:bg-telemetry-amber/90 transition-all shadow-glow-amber"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Flight Ops</span>
        </Link>
      </div>
    </div>
  );
}
