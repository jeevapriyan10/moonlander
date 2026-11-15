"use client";

import React, { useState, useMemo } from "react";
import {
  generatePorkchopPlot,
  computeSynodicPeriodDays,
  evaluateTransferWindow,
  type PorkchopGrid,
  type TransferWindowResult,
} from "@/engine/interplanetary";
import { Navigation, Info } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface PorkchopPlotProps {
  originBodyId?: string;
  targetBodyId?: string;
  onSelectWindow?: (result: TransferWindowResult) => void;
  className?: string;
}

export const PorkchopPlot: React.FC<PorkchopPlotProps> = ({
  originBodyId = "earth",
  targetBodyId = "mars",
  onSelectWindow,
  className = "",
}) => {
  // Transfer window search parameters (centered around mid-2024 departure)
  const baseDepartureDay = 8800;
  const departureSpanDays = 120;
  const flightTimeMinDays = 160;
  const flightTimeMaxDays = 300;

  // Generate 12x12 grid of trajectory delta-V evaluations
  const grid: PorkchopGrid = useMemo(() => {
    return generatePorkchopPlot(
      originBodyId,
      targetBodyId,
      baseDepartureDay,
      departureSpanDays,
      flightTimeMinDays,
      flightTimeMaxDays,
      12
    );
  }, [originBodyId, targetBodyId]);

  // Current selected point (defaults to optimal departure)
  const [selectedDeparture, setSelectedDeparture] = useState<number>(grid.optimalDepartureDay);
  const [selectedTof, setSelectedTof] = useState<number>(grid.optimalFlightTimeDays);

  const currentEvaluation = useMemo(() => {
    return evaluateTransferWindow(originBodyId, targetBodyId, selectedDeparture, selectedTof);
  }, [originBodyId, targetBodyId, selectedDeparture, selectedTof]);

  const synodicPeriod = useMemo(() => {
    return computeSynodicPeriodDays(originBodyId, targetBodyId);
  }, [originBodyId, targetBodyId]);

  // Color mapping helper: maps Delta-V to a cyan-to-orange-to-red gradient (in km/s)
  const getDvColor = (dvMs: number) => {
    const dvKmS = dvMs / 1000;
    if (dvKmS > 15.0) return "#EF4444"; // High / infeasible
    if (dvKmS > 9.0) return "#F97316";  // Elevated
    if (dvKmS > 6.5) return "#FBBF24";  // Moderate
    if (dvKmS > 4.5) return "#10B981";  // Efficient
    return "#06B6D4";                   // Optimal sweet-spot
  };

  const handleCellClick = (dep: number, tof: number) => {
    setSelectedDeparture(dep);
    setSelectedTof(tof);
    const result = evaluateTransferWindow(originBodyId, targetBodyId, dep, tof);
    if (onSelectWindow) {
      onSelectWindow(result);
    }
  };

  return (
    <div className={`flex flex-col gap-4 p-4 rounded-lg bg-space-panel border border-space-border ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="info">Astrodynamics</Badge>
            <span className="font-mono text-xs text-slate-400 uppercase">
              {originBodyId} → {targetBodyId} Transfer Window
            </span>
          </div>
          <h3 className="font-heading uppercase text-base font-bold text-white tracking-wider flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-telemetry-amber" />
            <span>Porkchop Plot Trajectory Contour</span>
          </h3>
        </div>

        <div className="text-right font-mono text-xs text-slate-400">
          <span className="block text-[10px] uppercase text-slate-500">Synodic Cycle</span>
          <span className="text-telemetry-cyan font-bold">{synodicPeriod} Days</span>
        </div>
      </div>

      {/* Main Porkchop Grid Visualization */}
      <div className="relative border border-space-border rounded bg-space-950 p-3">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-2">
          <span>Y: Flight Time (160 - 300 days)</span>
          <span>X: Departure Window (Days from Epoch)</span>
        </div>

        {/* Heatmap Grid Cells */}
        <div className="grid grid-cols-12 gap-1 h-44 w-full">
          {grid.deltaVMatrix.map((col, colIdx) => {
            const depDay = grid.depEpochs[colIdx] ?? baseDepartureDay;
            return (
              <div key={colIdx} className="flex flex-col gap-1 h-full">
                {col.map((dvMs, rowIdx) => {
                  const tof = grid.tofDays[rowIdx] ?? flightTimeMinDays;
                  const isSelected =
                    Math.abs(depDay - selectedDeparture) < 6 && Math.abs(tof - selectedTof) < 6;
                  const isOptimal =
                    Math.abs(depDay - grid.optimalDepartureDay) < 6 &&
                    Math.abs(tof - grid.optimalFlightTimeDays) < 6;

                  return (
                    <button
                      key={rowIdx}
                      type="button"
                      onClick={() => handleCellClick(depDay, tof)}
                      style={{ backgroundColor: getDvColor(dvMs) }}
                      className={`flex-1 rounded-sm transition-transform relative group hover:scale-125 hover:z-20 ${
                        isSelected
                          ? "ring-2 ring-white scale-110 z-10 shadow-lg"
                          : "opacity-85 hover:opacity-100"
                      }`}
                      title={`Dep: Day ${depDay.toFixed(0)}, TOF: ${tof.toFixed(0)}d | Δv: ${(dvMs / 1000).toFixed(2)} km/s`}
                    >
                      {isOptimal && (
                        <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Grid Axis Labels */}
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-2 pt-1 border-t border-space-border/40">
          <span>T₀: +{baseDepartureDay}d</span>
          <span>Optimal Launch: Day +{grid.optimalDepartureDay.toFixed(0)}</span>
          <span>T₀: +{(baseDepartureDay + departureSpanDays)}d</span>
        </div>
      </div>

      {/* Selected Trajectory Telemetry Readout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded bg-space-bg border border-space-border font-mono text-xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Departure Δv</span>
          <span className="text-sm font-bold text-telemetry-amber">
            {(currentEvaluation.deltaVDepartureMs / 1000).toFixed(2)} km/s
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Arrival Δv</span>
          <span className="text-sm font-bold text-telemetry-cyan">
            {(currentEvaluation.deltaVArrivalMs / 1000).toFixed(2)} km/s
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Total Mission Δv</span>
          <span className="text-sm font-bold text-telemetry-green">
            {(currentEvaluation.totalDeltaVMs / 1000).toFixed(2)} km/s
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Launch Energy (C₃)</span>
          <span className="text-sm font-bold text-white">
            {currentEvaluation.c3DepartureKm2S2.toFixed(1)} km²/s²
          </span>
        </div>
      </div>

      {/* Educational Explainer */}
      <div className="flex items-start gap-2 text-[11px] font-mono text-slate-400 leading-relaxed bg-space-panel/60 p-2.5 rounded border border-space-border/50">
        <Info className="w-4 h-4 text-telemetry-cyan shrink-0 mt-0.5" />
        <span>
          A <strong>Porkchop Plot</strong> charts the orbital mechanics contours of interplanetary flight. The lowest point
          (bright cyan) defines the minimum propellant transfer window dictated by planetary synodic alignment.
        </span>
      </div>
    </div>
  );
};
