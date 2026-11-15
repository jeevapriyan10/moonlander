"use client";

import React, { useState } from "react";
import { CanvasWrapper } from "./CanvasWrapper";
import { CameraRig, type CameraPreset } from "./CameraRig";
import { Spacecraft } from "./Spacecraft";
import { OrbitView } from "./OrbitView";
import { SolarSystemView } from "./SolarSystemView";
import { Eye, Orbit, Globe, RotateCw, Sparkles } from "lucide-react";
import { useSettingsStore } from "@/store/settings";

export type ViewportMode = "spacecraft" | "orbit" | "solar-system";

export interface Viewport3DProps {
  initialMode?: ViewportMode;
  className?: string;
  showModeSwitch?: boolean;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  initialMode = "spacecraft",
  className = "w-full h-full relative",
  showModeSwitch = true,
}) => {
  const [mode, setMode] = useState<ViewportMode>(initialMode);
  const [autoRotate, setAutoRotate] = useState(false);
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality);

  const preset: CameraPreset =
    mode === "spacecraft" ? "spacecraft" : mode === "orbit" ? "orbit" : "solar-system";

  return (
    <div className={className}>
      <CanvasWrapper>
        <CameraRig
          preset={preset}
          autoRotate={autoRotate}
          autoRotateSpeed={mode === "spacecraft" ? 0.4 : 0.15}
        />
        {mode === "spacecraft" ? (
          <Spacecraft autoRotate={autoRotate} />
        ) : mode === "orbit" ? (
          <OrbitView />
        ) : (
          <SolarSystemView />
        )}
      </CanvasWrapper>

      {/* Floating HUD Controls Overlay */}
      {showModeSwitch && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 p-1 rounded bg-space-950/85 backdrop-blur border border-space-800">
          <button
            type="button"
            onClick={() => setMode("spacecraft")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-heading uppercase tracking-wider rounded transition-colors ${
              mode === "spacecraft"
                ? "bg-telemetry-amber/20 text-telemetry-amber border border-telemetry-amber/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Spacecraft</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("orbit")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-heading uppercase tracking-wider rounded transition-colors ${
              mode === "orbit"
                ? "bg-telemetry-cyan/20 text-telemetry-cyan border border-telemetry-cyan/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            <span>Trajectory</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("solar-system")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-heading uppercase tracking-wider rounded transition-colors ${
              mode === "solar-system"
                ? "bg-telemetry-green/20 text-telemetry-green border border-telemetry-green/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Solar System</span>
          </button>

          <div className="h-4 w-[1px] bg-space-800 mx-0.5" />

          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            title="Toggle Continuous Turntable Rotation"
            className={`p-1.5 rounded transition-colors ${
              autoRotate
                ? "text-telemetry-amber bg-telemetry-amber/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin" : ""}`} />
          </button>
        </div>
      )}

      {/* Bottom right telemetry indicator */}
      <div className="absolute bottom-2 right-2 pointer-events-none flex items-center gap-2 px-2 py-0.5 rounded bg-space-950/70 border border-space-900 font-mono text-[9px] text-slate-500">
        <Sparkles className="w-2.5 h-2.5 text-telemetry-cyan" />
        <span>R3F PBR | {graphicsQuality}</span>
      </div>
    </div>
  );
};
