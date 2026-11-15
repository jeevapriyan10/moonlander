"use client";

import React from "react";

export const WorkspaceSkeleton: React.FC = () => {
  return (
    <div className="h-screen h-[100dvh] w-full bg-space-bg flex flex-col overflow-hidden text-slate-200 animate-pulse">
      {/* TopBar Skeleton */}
      <div className="h-12 bg-space-bg/95 border-b border-space-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-space-panel" />
          <div className="w-28 h-5 rounded bg-space-panel" />
          <div className="w-32 h-4 rounded bg-space-panel/60" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-7 rounded bg-space-panel/80" />
          <div className="w-20 h-7 rounded bg-space-panel/80" />
        </div>
      </div>

      {/* StageRail Skeleton */}
      <div className="h-11 border-b border-space-border bg-space-panel/40 px-4 flex items-center justify-center shrink-0">
        <div className="flex items-center gap-2 max-w-4xl w-full justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-28 rounded bg-space-panel/50" />
          ))}
        </div>
      </div>

      {/* 3-Column Workspace Skeleton */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left catalog */}
        <div className="w-[380px] border-r border-space-border bg-space-panel/30 p-4 flex flex-col gap-3 shrink-0 hidden md:flex">
          <div className="h-6 w-32 rounded bg-space-panel/80" />
          <div className="h-10 w-full rounded bg-space-panel/50" />
          <div className="flex-1 rounded bg-space-panel/20 border border-space-border/40" />
        </div>

        {/* Center viewport */}
        <div className="flex-1 bg-space-bg/90 relative flex flex-col items-center justify-center p-6">
          <div className="w-12 h-12 rounded-full border-2 border-telemetry-amber/40 border-t-telemetry-amber animate-spin mb-4" />
          <span className="font-mono text-xs text-telemetry-amber uppercase tracking-widest">
            ESTABLISHING GROUND STATION LINK // CALIBRATING INSTRUMENTS...
          </span>
          <div className="w-64 h-1.5 bg-space-panel rounded-full overflow-hidden mt-3">
            <div className="h-full bg-telemetry-amber w-2/3 animate-pulse" />
          </div>
        </div>

        {/* Right dashboard */}
        <div className="w-[360px] border-l border-space-border bg-space-panel/30 p-4 flex flex-col gap-3 shrink-0 hidden md:flex">
          <div className="h-6 w-36 rounded bg-space-panel/80" />
          <div className="h-28 w-full rounded bg-space-panel/50" />
          <div className="h-28 w-full rounded bg-space-panel/50" />
          <div className="flex-1 rounded bg-space-panel/20 border border-space-border/40" />
        </div>
      </div>
    </div>
  );
};
