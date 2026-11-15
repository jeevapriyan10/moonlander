"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MoonLander] Flight Computer Exception Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-space-bg flex flex-col items-center justify-center p-6 text-center text-slate-200">
      <div className="max-w-lg w-full p-8 rounded border border-alert-red/50 bg-space-panel/95 backdrop-blur-md shadow-2xl flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-alert-red/20 border-2 border-alert-red flex items-center justify-center shadow-glow-red animate-pulse">
          <AlertOctagon className="w-8 h-8 text-alert-red" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-alert-red uppercase tracking-widest font-bold">
            CRITICAL EXCEPTION // SAFE MODE ENGAGED
          </span>
          <h1 className="text-2xl font-heading uppercase tracking-widest text-white font-bold">
            Flight Computer Pipeline Fault
          </h1>
        </div>

        <p className="text-xs font-mono text-gray-300 leading-relaxed bg-black/50 p-3 rounded border border-space-border w-full text-left overflow-x-auto">
          {error.message || "An unexpected system fault interrupted the flight telemetry loop."}
        </p>

        {error.digest && (
          <span className="text-[10px] font-mono text-gray-500">
            FAULT DIGEST: {error.digest}
          </span>
        )}

        <div className="flex items-center gap-3 w-full pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-telemetry-amber text-black font-heading font-bold text-xs uppercase tracking-wider hover:bg-telemetry-amber/90 transition-all shadow-glow-amber"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reboot Systems</span>
          </button>

          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded border border-space-border bg-black/40 text-gray-300 font-heading text-xs uppercase tracking-wider hover:text-white hover:border-space-border-active transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Mission Control</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
