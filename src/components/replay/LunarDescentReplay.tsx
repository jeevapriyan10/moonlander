"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  type ReplayLog,
  type LanderState,
  type TerrainMap,
  generateTerrain,
  replayDescent,
} from "@/engine/lander";
import { landingSites } from "@/data";

const TOUCHDOWN_TIER_COLORS: Record<string, string> = {
  perfect: "#10B981",
  safe: "#06B6D4",
  hard: "#F59E0B",
  "tip-over": "#F97316",
  crash: "#EF4444",
  "out-of-fuel": "#DC2626",
};
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface LunarDescentReplayProps {
  log: ReplayLog;
  className?: string;
  onExit?: () => void;
}

export const LunarDescentReplay: React.FC<LunarDescentReplayProps> = ({
  log,
  className = "",
  onExit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute full replay states deterministically
  const rawSite = landingSites.find((s) => s.id === log.siteId) || landingSites[0]!;
  const site = {
    ...rawSite,
    safeZoneX: 0,
    scienceTargetX: rawSite.scienceTargetOffsetM ?? 100,
  };
  const terrain = useRef<TerrainMap>(generateTerrain(log.seed, site)).current;
  const replayResult = useRef(replayDescent(log, terrain)).current;
  const states = replayResult.states;

  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const totalFrames = states.length;
  const currentState: LanderState = states[frameIndex] || states[states.length - 1]!;

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(16 / playbackSpeed); // ~60fps scaled by speed
    const timer = setInterval(() => {
      setFrameIndex((prev) => {
        if (prev >= totalFrames - 1) {
          setIsPlaying(false);
          return totalFrames - 1;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, totalFrames]);

  // Render 2D Descent Canvas Plot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear background
    ctx.fillStyle = "#05070D";
    ctx.fillRect(0, 0, w, h);

    // Map physics coords (X: -1500 to +1500, Y: -50 to 2200) to Canvas pixels
    const minX = -1200;
    const maxX = 1200;
    const minY = -50;
    const maxY = 2200;

    const toCanvasX = (physX: number) => ((physX - minX) / (maxX - minX)) * w;
    const toCanvasY = (physY: number) => h - ((physY - minY) / (maxY - minY)) * h;

    // 1. Grid
    ctx.strokeStyle = "rgba(27, 36, 64, 0.4)";
    ctx.lineWidth = 1;
    for (let py = 0; py <= maxY; py += 500) {
      const cy = toCanvasY(py);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
      ctx.font = "10px monospace";
      ctx.fillText(`${py}m`, 10, cy - 4);
    }

    // 2. Draw Terrain Surface
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = minX; px <= maxX; px += 20) {
      const groundH = terrain.getHeight(px);
      const cx = toCanvasX(px);
      const cy = toCanvasY(groundH);
      if (px === minX) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // 3. Draw Safe Zone Target Box
    const szX = terrain.safeZoneX;
    const szH = terrain.getHeight(szX);
    const szLeft = toCanvasX(szX - terrain.safeRadiusM);
    const szRight = toCanvasX(szX + terrain.safeRadiusM);
    const szY = toCanvasY(szH);

    ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
    ctx.fillRect(szLeft, szY - 8, szRight - szLeft, 16);
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 2;
    ctx.strokeRect(szLeft, szY - 8, szRight - szLeft, 16);

    ctx.fillStyle = "#10B981";
    ctx.font = "bold 10px monospace";
    ctx.fillText("TARGET SAFE ZONE", szLeft + 5, szY - 12);

    // 4. Draw Hazards (boulders / crater rims)
    terrain.hazards.forEach((hazard) => {
      const hx = toCanvasX(hazard.x);
      const hy = toCanvasY(terrain.getHeight(hazard.x));
      const hr = Math.max(3, (hazard.radiusM / (maxX - minX)) * w);

      ctx.fillStyle = hazard.type === "boulder" ? "rgba(239, 68, 68, 0.6)" : "rgba(245, 158, 11, 0.5)";
      ctx.beginPath();
      ctx.arc(hx, hy - hr, hr, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Draw Flight Trajectory Path up to current frame
    ctx.strokeStyle = "rgba(0, 240, 255, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= frameIndex; i++) {
      const s = states[i]!;
      const tx = toCanvasX(s.x);
      const ty = toCanvasY(s.y);
      if (i === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.stroke();

    // 6. Draw Lander Craft at current state
    const lx = toCanvasX(currentState.x);
    const ly = toCanvasY(currentState.y);

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(currentState.pitchRad);

    // Lander Body (gold foil rectangle)
    ctx.fillStyle = "#FFB000";
    ctx.fillRect(-8, -8, 16, 12);

    // Landing Legs
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 4);
    ctx.lineTo(-14, 12);
    ctx.moveTo(8, 4);
    ctx.lineTo(14, 12);
    ctx.stroke();

    // Thruster exhaust flame (if firing)
    if (currentState.throttle > 0 && !currentState.fuelExhausted) {
      ctx.fillStyle = "#FF7700";
      ctx.beginPath();
      ctx.moveTo(-4, 4);
      ctx.lineTo(4, 4);
      ctx.lineTo(0, 16 + Math.random() * 6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }, [frameIndex, states, terrain, currentState]);

  return (
    <div className={`flex flex-col gap-3 font-mono text-xs text-slate-200 ${className}`}>
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-space-border pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="amber" size="sm">
            DESCENT TELEMETRY REPLAY
          </Badge>
          <span className="font-heading font-bold uppercase text-white">
            {site.name} ({site.latDeg.toFixed(1)}°N)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={replayResult.tier === "perfect" || replayResult.tier === "safe" ? "nominal" : "alert"}
            size="sm"
          >
            {replayResult.tier.toUpperCase()} TOUCHDOWN
          </Badge>

          {onExit && (
            <Button variant="ghost" size="sm" onClick={onExit}>
              Close Replay
            </Button>
          )}
        </div>
      </div>

      {/* Main 2D Trajectory Viewport Canvas */}
      <div className="w-full aspect-[2/1] min-h-[300px] max-h-[460px] rounded-lg border border-space-border bg-black/60 relative overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={1000}
          height={500}
          className="w-full h-full block"
        />

        {/* Live Gauges HUD overlay */}
        <div className="absolute top-3 left-3 p-2.5 rounded bg-black/70 border border-space-border/80 backdrop-blur-md flex flex-col gap-1 text-[11px]">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Time:</span>
            <span className="text-white font-bold">T+ {currentState.t.toFixed(1)} s</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Altitude AGL:</span>
            <span className="text-telemetry-green font-bold">{currentState.altitudeAGL.toFixed(1)} m</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Vertical Speed (Vy):</span>
            <span
              className={`font-bold ${
                Math.abs(currentState.vy) <= 2.5 ? "text-telemetry-green" : "text-red-400"
              }`}
            >
              {currentState.vy.toFixed(2)} m/s
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Horizontal (Vx):</span>
            <span className="text-telemetry-cyan font-bold">{currentState.vx.toFixed(2)} m/s</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Tilt Angle:</span>
            <span className="text-telemetry-amber font-bold">
              {((currentState.pitchRad * 180) / Math.PI).toFixed(1)}°
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Propellant Left:</span>
            <span className="text-white font-bold">{currentState.propellantKg.toFixed(1)} kg</span>
          </div>
        </div>
      </div>

      {/* Interactive Timeline Scrubber & Speed Controls */}
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-space-panel/90 border border-space-border">
        {/* Scrubber slider */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={totalFrames - 1}
            value={frameIndex}
            onChange={(e) => setFrameIndex(parseInt(e.target.value, 10))}
            className="flex-1 accent-telemetry-amber cursor-pointer"
          />
          <span className="text-xs text-gray-400 w-16 text-right">
            {currentState.t.toFixed(1)}s / {(states[states.length - 1]?.t || 0).toFixed(1)}s
          </span>
        </div>

        {/* Playback action buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFrameIndex(0);
                setIsPlaying(true);
              }}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rewind</span>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 mr-1">Speed:</span>
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                  playbackSpeed === spd
                    ? "bg-telemetry-amber text-black"
                    : "bg-black/40 text-gray-400 hover:text-white"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
