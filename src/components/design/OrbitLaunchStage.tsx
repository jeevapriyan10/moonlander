"use client";

import React from "react";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { orbits, launchers } from "@/data";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatReadout } from "@/components/ui/StatReadout";
import { PorkchopPlot } from "@/components/design/PorkchopPlot";
import {
  Rocket,
  Orbit as OrbitIcon,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

export interface OrbitLaunchStageProps {
  onStartLaunch: () => void;
}

export const OrbitLaunchStage: React.FC<OrbitLaunchStageProps> = ({
  onStartLaunch,
}) => {
  const { currentMission, updateDesign, evaluation } = useMissionStore();
  const { setCurrentStage } = useUIStore();

  const selectedOrbit =
    orbits.find((o) => o.id === currentMission.orbitId) ?? orbits[0]!;

  const selectedLauncher =
    launchers.find((l) => l.id === currentMission.launcherId) ?? launchers[0]!;

  const { launchReady, validation } = evaluation;
  const errors = validation.filter((v) => v.severity === "error");

  const launcherCapacityForOrbit =
    selectedLauncher.capacityKg[selectedOrbit.launcherClassNeeded];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-1 border-b border-space-border pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="amber" size="sm">
            STAGE 04 : TRAJECTORY & LAUNCH SERVICES
          </Badge>
          <Badge variant={launchReady ? "nominal" : "alert"} size="sm">
            {launchReady ? "FLIGHT CERTIFIED" : "LAUNCH HOLD"}
          </Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-heading uppercase tracking-widest text-white font-bold">
          Orbit Injection & Launch Vehicle Integration
        </h1>
        <p className="text-xs font-mono text-gray-400">
          Pair your spacecraft with a certified launch vehicle and verify mass capacity, fairing clearance, and orbital insertion requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Orbit Selector */}
        <Panel
          title={
            <span className="flex items-center gap-2 text-telemetry-cyan">
              <OrbitIcon className="w-4 h-4" />
              <span>Target Mission Orbit</span>
            </span>
          }
          bodyClassName="flex flex-col gap-3 p-4"
        >
          <div className="flex flex-col gap-2">
            {orbits.map((orb) => {
              const isSelected = orb.id === currentMission.orbitId;
              return (
                <div
                  key={orb.id}
                  onClick={() => updateDesign({ orbitId: orb.id })}
                  className={`p-2.5 rounded border transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? "bg-telemetry-cyan/15 border-telemetry-cyan"
                      : "bg-black/30 border-space-border hover:border-space-border-active"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading uppercase text-xs font-bold text-gray-200">
                      {orb.name}
                    </span>
                    <Badge variant={isSelected ? "info" : "neutral"} size="sm">
                      {orb.regime}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-mono text-gray-300">
                    {orb.explain}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-space-border">
            <StatReadout
              label="Perigee Alt"
              value={selectedOrbit.perigeeAltKm}
              unit="km"
              size="sm"
            />
            <StatReadout
              label="Inclination"
              value={selectedOrbit.inclinationDeg}
              unit="°"
              size="sm"
            />
          </div>
        </Panel>

        {/* 2. Launcher Selector */}
        <Panel
          title={
            <span className="flex items-center gap-2 text-telemetry-amber">
              <Rocket className="w-4 h-4" />
              <span>Launch Vehicle Selection</span>
            </span>
          }
          bodyClassName="flex flex-col gap-3 p-4"
        >
          <div className="flex flex-col gap-2">
            {launchers.map((l) => {
              const isSelected = l.id === currentMission.launcherId;
              const cap = l.capacityKg[selectedOrbit.launcherClassNeeded];
              const isSupported = cap !== null;

              return (
                <div
                  key={l.id}
                  onClick={() => isSupported && updateDesign({ launcherId: l.id })}
                  className={`p-2.5 rounded border transition-all flex flex-col gap-1 ${
                    !isSupported
                      ? "opacity-35 bg-black/10 border-space-border cursor-not-allowed"
                      : isSelected
                        ? "bg-telemetry-amber/15 border-telemetry-amber cursor-pointer"
                        : "bg-black/30 border-space-border hover:border-space-border-active cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading uppercase text-xs font-bold text-gray-200">
                      {l.name}
                    </span>
                    <Badge variant={isSelected ? "amber" : "neutral"} size="sm">
                      ${l.priceM}M | {(l.reliability * 100).toFixed(0)}% Rel
                    </Badge>
                  </div>

                  <p className="text-[11px] font-mono text-gray-300">
                    {l.explain}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1 border-t border-space-border/40">
                    <span>
                      Lift to {selectedOrbit.launcherClassNeeded.toUpperCase()}:{" "}
                      <strong className={isSupported ? "text-telemetry-green" : "text-telemetry-red"}>
                        {isSupported ? `${cap} kg` : "Unsupported"}
                      </strong>
                    </span>
                    <span>Fairing: {l.fairingDiameterM}m</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-space-border">
            <StatReadout
              label="Wet Mass"
              value={evaluation.mass.totalWetMassKg.toFixed(0)}
              unit="kg"
              limit={launcherCapacityForOrbit ? `${launcherCapacityForOrbit} kg` : "N/A"}
              size="sm"
              status={
                launcherCapacityForOrbit &&
                evaluation.mass.totalWetMassKg <= launcherCapacityForOrbit
                  ? "nominal"
                  : "alert"
              }
            />
            <StatReadout
              label="Fairing Clearance"
              value={`${selectedLauncher.fairingDiameterM}m`}
              limit={`Bus: ${evaluation.mass.busDryMassKg > 0 ? "OK" : "OK"}`}
              size="sm"
              status="nominal"
            />
          </div>
        </Panel>
      </div>

      {/* Interplanetary Astrodynamics Trajectory Planner (for Deep Space & Planetary Missions) */}
      {(selectedOrbit.launcherClassNeeded === "tmi" ||
        selectedOrbit.launcherClassNeeded === "tli" ||
        selectedOrbit.regime === "MARS" ||
        selectedOrbit.regime === "JUPITER" ||
        selectedOrbit.regime === "L1" ||
        selectedOrbit.regime === "L2") && (
        <PorkchopPlot
          originBodyId="earth"
          targetBodyId={
            selectedOrbit.regime === "MARS"
              ? "mars"
              : selectedOrbit.regime === "JUPITER"
              ? "jupiter"
              : "mars"
          }
        />
      )}

      {/* Flight Readiness Certification & Launch Button */}
      <Panel
        title={
          <span className="flex items-center gap-2 text-gray-200">
            {launchReady ? (
              <ShieldCheck className="w-5 h-5 text-telemetry-green" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-telemetry-red animate-pulse" />
            )}
            <span>Pre-Flight Readiness Review</span>
          </span>
        }
        bodyClassName="p-4 flex flex-col gap-3"
      >
        <div className="flex flex-col gap-2">
          {launchReady ? (
            <div className="p-3 rounded bg-telemetry-green/10 border border-telemetry-green/40 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-telemetry-green shrink-0" />
              <div className="text-xs font-mono">
                <span className="font-heading uppercase tracking-wider text-telemetry-green font-bold block">
                  Flight Certification Authorized
                </span>
                <span className="text-gray-300">
                  Mass margins, power generation balance, thermal survivability, and launch vehicle fairing clearances satisfy all criteria.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded bg-telemetry-red/10 border border-telemetry-red/40 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-telemetry-red shrink-0" />
              <div className="text-xs font-mono">
                <span className="font-heading uppercase tracking-wider text-telemetry-red font-bold block">
                  Launch Authorization Withheld ({errors.length} Critical Errors)
                </span>
                <span className="text-gray-300">
                  Unresolved engineering constraints prevent launch clearance. Consult the Mission Systems Advisor console below to apply automated fixes.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-space-border mt-1">
          <Button
            size="md"
            variant="outline"
            onClick={() => setCurrentStage(3)}
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Design</span>
          </Button>

          <Button
            size="lg"
            variant={launchReady ? "primary" : "danger"}
            disabled={!launchReady}
            onClick={onStartLaunch}
            className="flex items-center gap-2 px-8 py-3 text-base shadow-glow-amber"
          >
            <Rocket className="w-5 h-5" />
            <span>INITIATE LAUNCH SEQUENCE</span>
          </Button>
        </div>
      </Panel>
    </div>
  );
};

