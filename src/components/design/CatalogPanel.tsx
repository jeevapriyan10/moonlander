"use client";

import React from "react";
import { useMissionStore } from "@/store/mission";
import { useUIStore, type DesignTab } from "@/store/ui";
import {
  buses,
  solarArrays,
  batteries,
  propulsions,
  flightComputers,
  adcsSystems,
  thermals,
  commsSystems,
  storages,
  instruments,
  isItemAvailableForDifficulty,
} from "@/data";
import { Tabs } from "@/components/ui/Tabs";
import { Slider } from "@/components/ui/Slider";
import { Badge } from "@/components/ui/Badge";
import { Term } from "@/components/ui/Term";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { autoDesign, type AutoDesignPreference } from "@/engine/autodesign";
import {
  Sparkles,
  Box,
  Zap,
  Flame,
  Cpu,
  Thermometer,
  Radio,
  Check,
  Lock,
  Wand2,
  DollarSign,
  Shield,
  Star,
} from "lucide-react";

export const CatalogPanel: React.FC<{ className?: string }> = ({ className }) => {
  const { currentMission, updateDesign } = useMissionStore();
  const { designTab, setDesignTab, addToast } = useUIStore();
  const [autoModalOpen, setAutoModalOpen] = React.useState(false);
  const [lastRationale, setLastRationale] = React.useState<string[] | null>(null);

  const handleRunAutoDesign = (preference: AutoDesignPreference) => {
    const result = autoDesign(
      currentMission.scenarioId,
      currentMission.difficulty,
      preference,
      currentMission.seed
    );

    updateDesign(result.config);
    setLastRationale(result.rationaleSummary);
    addToast({
      type: "success",
      title: `Auto-Design Applied (${preference.toUpperCase()})`,
      message: `Spacecraft architecture synthesized with certified launch readiness.`,
    });
  };

  const tabs = [
    { id: "payload", label: "Payload", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: "bus", label: "Bus", icon: <Box className="w-3.5 h-3.5" /> },
    { id: "power", label: "Power", icon: <Zap className="w-3.5 h-3.5" /> },
    { id: "propulsion", label: "Propulsion", icon: <Flame className="w-3.5 h-3.5" /> },
    { id: "avionics", label: "Avionics", icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: "thermal", label: "Thermal", icon: <Thermometer className="w-3.5 h-3.5" /> },
    { id: "comms", label: "Comms", icon: <Radio className="w-3.5 h-3.5" /> },
  ];

  const toggleInstrument = (instId: string) => {
    const current = currentMission.selectedInstrumentIds;
    if (current.includes(instId)) {
      if (current.length > 1) {
        updateDesign({
          selectedInstrumentIds: current.filter((id) => id !== instId),
        });
      }
    } else {
      updateDesign({
        selectedInstrumentIds: [...current, instId],
      });
    }
  };

  return (
    <div className={`flex flex-col h-full bg-space-panel/95 border-r border-space-border overflow-hidden select-none ${className ?? ""}`}>
      {/* Auto-Design Quick Assist Header */}
      <div className="px-3 py-1.5 border-b border-space-border/60 bg-black/30 flex items-center justify-between">
        <span className="font-mono text-[10px] text-slate-400">SUBSYSTEM SUITE</span>
        <button
          type="button"
          onClick={() => setAutoModalOpen(true)}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-telemetry-amber/50 bg-telemetry-amber/10 hover:bg-telemetry-amber/20 text-telemetry-amber text-[11px] font-heading uppercase tracking-wider transition-colors shadow-glow-amber/5"
          title="Synthesize certified spacecraft configuration automatically"
        >
          <Wand2 className="w-3 h-3 text-telemetry-amber" />
          <span>Auto-Design</span>
        </button>
      </div>

      {/* Subsystem Navigation Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={designTab}
        onChange={(tabId) => setDesignTab(tabId as DesignTab)}
        size="sm"
      />

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* TAB 1: PAYLOAD INSTRUMENTS */}
        {designTab === "payload" && (
          <div className="flex flex-col gap-2.5">
            <div className="text-xs text-gray-400 font-mono flex items-center justify-between">
              <span>Select Scientific Payloads ({currentMission.selectedInstrumentIds.length} active)</span>
              <span className="text-[10px] text-gray-500">Multiselect enabled</span>
            </div>

            {instruments.map((inst) => {
              const isSelected = currentMission.selectedInstrumentIds.includes(inst.id);
              const isAllowed = isItemAvailableForDifficulty(inst.minLevel, currentMission.difficulty);

              return (
                <div
                  key={inst.id}
                  onClick={() => isAllowed && toggleInstrument(inst.id)}
                  className={`p-3 rounded border transition-all duration-150 cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? "bg-telemetry-amber/10 border-telemetry-amber shadow-glow-amber"
                      : isAllowed
                        ? "bg-black/30 border-space-border hover:border-space-border-active hover:bg-white/5"
                        : "opacity-40 bg-black/20 border-space-border cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading uppercase tracking-wider text-xs font-bold text-gray-200 flex items-center gap-1.5">
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                          isSelected
                            ? "bg-telemetry-amber border-telemetry-amber text-space-bg"
                            : "border-space-border"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      {inst.name}
                    </span>
                    <Badge variant={isSelected ? "amber" : "neutral"} size="sm">
                      ${inst.costM}M
                    </Badge>
                  </div>

                  <p className="text-[11px] font-mono text-gray-300 leading-snug">
                    {inst.explain}
                  </p>

                  <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-space-border/50 text-[10px] font-mono text-gray-400">
                    <div>
                      <span>Mass: </span>
                      <span className="text-gray-200">{inst.massKg} kg</span>
                    </div>
                    <div>
                      <span>Power: </span>
                      <span className="text-gray-200">{inst.avgPowerW} W</span>
                    </div>
                    <div>
                      <span>Rate: </span>
                      <span className="text-gray-200">{inst.dataRateMbps} Mbps</span>
                    </div>
                  </div>

                  {inst.requiresCryo && (
                    <div className="text-[10px] font-mono text-telemetry-cyan flex items-center gap-1">
                      <span>Requires active cryocooler (65-80K)</span>
                    </div>
                  )}

                  {!isAllowed && (
                    <div className="text-[10px] font-mono text-telemetry-orange flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Requires {inst.minLevel} difficulty</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: SPACECRAFT BUS */}
        {designTab === "bus" && (
          <div className="flex flex-col gap-2.5">
            <span className="text-xs text-gray-400 font-mono">
              Select Primary Structural Bus Class
            </span>

            {buses.map((bus) => {
              const isSelected = currentMission.busId === bus.id;
              const isAllowed = isItemAvailableForDifficulty(bus.minLevel, currentMission.difficulty);

              return (
                <div
                  key={bus.id}
                  onClick={() => isAllowed && updateDesign({ busId: bus.id })}
                  className={`p-3 rounded border transition-all duration-150 cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? "bg-telemetry-amber/10 border-telemetry-amber shadow-glow-amber"
                      : isAllowed
                        ? "bg-black/30 border-space-border hover:border-space-border-active hover:bg-white/5"
                        : "opacity-40 bg-black/20 border-space-border cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading uppercase tracking-wider text-xs font-bold text-gray-200">
                      {bus.name}
                    </span>
                    <Badge variant={isSelected ? "amber" : "neutral"} size="sm">
                      ${bus.baseCostM}M | {bus.baseScheduleMonths} mo
                    </Badge>
                  </div>

                  <p className="text-[11px] font-mono text-gray-300 leading-snug">
                    {bus.explain}
                  </p>

                  <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-space-border/50 text-[10px] font-mono text-gray-400">
                    <div>
                      <span>Structure: </span>
                      <span className="text-gray-200">{bus.structuralMassKg} kg</span>
                    </div>
                    <div>
                      <span>Max Dry: </span>
                      <span className="text-gray-200">{bus.maxDryMassKg} kg</span>
                    </div>
                    <div>
                      <span>Dia: </span>
                      <span className="text-gray-200">{bus.diameterM} m</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: POWER (SOLAR & BATTERY) */}
        {designTab === "power" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-300 font-heading uppercase tracking-wider font-semibold">
                Solar Array Technology
              </span>
              <div className="grid grid-cols-2 gap-2">
                {solarArrays.map((sa) => (
                  <button
                    key={sa.id}
                    onClick={() => updateDesign({ solarArrayId: sa.id })}
                    className={`p-2.5 rounded border text-left flex flex-col gap-1 transition-all ${
                      currentMission.solarArrayId === sa.id
                        ? "bg-telemetry-amber/15 border-telemetry-amber"
                        : "bg-black/30 border-space-border hover:border-space-border-active"
                    }`}
                  >
                    <span className="font-heading uppercase text-xs font-bold text-gray-200 truncate">
                      {sa.name}
                    </span>
                    <span className="font-mono text-[11px] text-telemetry-amber">
                      {(sa.efficiency * 100).toFixed(0)}% Eff | ${sa.costPerM2M}M/m²
                    </span>
                  </button>
                ))}
              </div>

              <Slider
                label="Solar Array Surface Area"
                value={currentMission.solarArrayAreaM2}
                min={0.5}
                max={25.0}
                step={0.1}
                unit="m²"
                onChange={(val) => updateDesign({ solarArrayAreaM2: val })}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-space-border/60">
              <span className="text-xs text-gray-300 font-heading uppercase tracking-wider font-semibold">
                Battery Storage Technology
              </span>
              <div className="grid grid-cols-2 gap-2">
                {batteries.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => updateDesign({ batteryId: b.id })}
                    className={`p-2.5 rounded border text-left flex flex-col gap-1 transition-all ${
                      currentMission.batteryId === b.id
                        ? "bg-telemetry-amber/15 border-telemetry-amber"
                        : "bg-black/30 border-space-border hover:border-space-border-active"
                    }`}
                  >
                    <span className="font-heading uppercase text-xs font-bold text-gray-200 truncate">
                      {b.name}
                    </span>
                    <span className="font-mono text-[11px] text-telemetry-cyan">
                      {b.specificEnergyWhKg} Wh/kg
                    </span>
                  </button>
                ))}
              </div>

              <Slider
                label="Installed Battery Capacity"
                value={currentMission.batteryCapacityWh}
                min={50}
                max={4000}
                step={25}
                unit="Wh"
                onChange={(val) => updateDesign({ batteryCapacityWh: val })}
              />
            </div>
          </div>
        )}

        {/* TAB 4: PROPULSION & DELTA-V */}
        {designTab === "propulsion" && (
          <div className="flex flex-col gap-3">
            <span className="text-xs text-gray-300 font-heading uppercase tracking-wider font-semibold">
              Propulsion Subsystem Engine
            </span>

            {propulsions.map((p) => {
              const isSelected = currentMission.propulsionId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => updateDesign({ propulsionId: p.id })}
                  className={`p-3 rounded border transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? "bg-telemetry-amber/10 border-telemetry-amber"
                      : "bg-black/30 border-space-border hover:border-space-border-active"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading uppercase text-xs font-bold text-gray-200">
                      {p.name}
                    </span>
                    <Badge variant={isSelected ? "amber" : "neutral"} size="sm">
                      Isp {p.ispSeconds}s | ${p.costM}M
                    </Badge>
                  </div>
                  <p className="text-[11px] font-mono text-gray-300">{p.explain}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1 border-t border-space-border/40">
                    <span>Dry: {p.dryMassKg} kg</span>
                    <span>Thrust: {p.thrustN} N</span>
                    <span>TRL: {p.trl}</span>
                  </div>
                </div>
              );
            })}

            <Slider
              label="Loaded Propellant Mass"
              value={currentMission.propellantMassKg}
              min={0}
              max={600}
              step={5}
              unit="kg"
              onChange={(val) => updateDesign({ propellantMassKg: val })}
            />
          </div>
        )}

        {/* TAB 5: AVIONICS (ADCS & FLIGHT COMPUTER) */}
        {designTab === "avionics" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-300 font-heading uppercase tracking-wider font-semibold">
                Attitude Determination & Control (ADCS)
              </span>
              {adcsSystems.map((adcs) => (
                <div
                  key={adcs.id}
                  onClick={() => updateDesign({ adcsId: adcs.id })}
                  className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                    currentMission.adcsId === adcs.id
                      ? "bg-telemetry-amber/10 border-telemetry-amber"
                      : "bg-black/30 border-space-border hover:border-space-border-active"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-heading uppercase text-xs font-bold text-gray-200">
                      {adcs.name}
                    </span>
                    <Badge variant={currentMission.adcsId === adcs.id ? "amber" : "neutral"} size="sm">
                      {adcs.pointingAccuracyDeg}° Pointing
                    </Badge>
                  </div>
                  <p className="text-[10px] font-mono text-gray-400 mt-0.5">{adcs.explain}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-space-border/60">
              <span className="text-xs text-gray-300 font-heading uppercase tracking-wider font-semibold">
                Flight Computer & Radiation Hardening
              </span>
              {flightComputers.map((fc) => (
                <div
                  key={fc.id}
                  onClick={() => updateDesign({ flightComputerId: fc.id })}
                  className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                    currentMission.flightComputerId === fc.id
                      ? "bg-telemetry-amber/10 border-telemetry-amber"
                      : "bg-black/30 border-space-border hover:border-space-border-active"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-heading uppercase text-xs font-bold text-gray-200">
                      {fc.name}
                    </span>
                    <Badge variant={currentMission.flightComputerId === fc.id ? "amber" : "neutral"} size="sm">
                      TID {fc.tidToleranceKrad} krad
                    </Badge>
                  </div>
                  <p className="text-[10px] font-mono text-gray-400 mt-0.5">{fc.explain}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: THERMAL SUBSYSTEM */}
        {designTab === "thermal" && (
          <div className="flex flex-col gap-2.5">
            <span className="text-xs text-gray-400 font-mono">
              Thermal Control Hardware
            </span>
            {thermals.map((th) => {
              const isSelected = currentMission.thermalId === th.id;
              return (
                <div
                  key={th.id}
                  onClick={() => updateDesign({ thermalId: th.id })}
                  className={`p-3 rounded border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? "bg-telemetry-amber/10 border-telemetry-amber"
                      : "bg-black/30 border-space-border hover:border-space-border-active"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading uppercase text-xs font-bold text-gray-200">
                      {th.name}
                    </span>
                    <Badge variant={isSelected ? "amber" : "neutral"} size="sm">
                      ${th.costM}M
                    </Badge>
                  </div>
                  <p className="text-[11px] font-mono text-gray-300">{th.explain}</p>
                  {th.supportsCryoIR && (
                    <span className="text-[10px] font-mono text-telemetry-cyan">
                      Supports Cryogenic Infrared Focal Planes (65-80K)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 7: COMMS & GROUND NETWORK */}
        {designTab === "comms" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-300 font-heading uppercase tracking-wider font-semibold">
                Communications Transceiver Band
              </span>
              {commsSystems.map((cm) => (
                <div
                  key={cm.id}
                  onClick={() => updateDesign({ commsId: cm.id })}
                  className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                    currentMission.commsId === cm.id
                      ? "bg-telemetry-amber/10 border-telemetry-amber"
                      : "bg-black/30 border-space-border hover:border-space-border-active"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-heading uppercase text-xs font-bold text-gray-200">
                      {cm.name}
                    </span>
                    <Badge variant={currentMission.commsId === cm.id ? "amber" : "neutral"} size="sm">
                      {cm.downlinkRateMbps} Mbps
                    </Badge>
                  </div>
                  <p className="text-[10px] font-mono text-gray-400 mt-0.5">{cm.explain}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-space-border/60">
              <span className="text-xs text-gray-300 font-heading uppercase tracking-wider font-semibold">
                Onboard Solid-State Storage (SSR)
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {storages.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => updateDesign({ storageGb: st.capacityGb })}
                    className={`p-2 rounded border text-center transition-all ${
                      currentMission.storageGb === st.capacityGb
                        ? "bg-telemetry-amber/15 border-telemetry-amber text-telemetry-amber font-bold"
                        : "bg-black/30 border-space-border text-gray-300 hover:border-space-border-active"
                    }`}
                  >
                    <span className="font-mono text-xs">{st.capacityGb} GB</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auto-Design Systems Engineering Modal */}
      <Modal
        isOpen={autoModalOpen}
        onClose={() => setAutoModalOpen(false)}
        title="Autonomous Spacecraft Systems Engineering"
        subtitle="Synthesize a certified, flight-ready configuration optimized for your priority objective."
        maxWidth="lg"
      >
        <div className="flex flex-col gap-4 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Cheapest */}
            <button
              type="button"
              onClick={() => {
                handleRunAutoDesign("cheapest");
                setAutoModalOpen(false);
              }}
              className="p-3.5 rounded border border-space-border hover:border-telemetry-green bg-black/40 hover:bg-space-panel text-left flex flex-col transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded bg-telemetry-green/10 text-telemetry-green border border-telemetry-green/30 group-hover:scale-105 transition-transform">
                  <DollarSign className="w-4 h-4" />
                </div>
                <Badge variant="nominal" size="sm" className="text-[10px]">
                  ECONOMICAL
                </Badge>
              </div>
              <h4 className="font-heading uppercase text-sm font-bold text-white mb-1 group-hover:text-telemetry-green transition-colors">
                Cheapest
              </h4>
              <p className="text-[11px] text-slate-300 font-body leading-relaxed">
                Minimizes lifecycle cost and launch vehicle expense while meeting all mandatory mission requirements.
              </p>
            </button>

            {/* Safest */}
            <button
              type="button"
              onClick={() => {
                handleRunAutoDesign("safest");
                setAutoModalOpen(false);
              }}
              className="p-3.5 rounded border border-telemetry-amber/50 hover:border-telemetry-amber bg-black/40 hover:bg-space-panel text-left flex flex-col transition-all group shadow-glow-amber/5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded bg-telemetry-amber/10 text-telemetry-amber border border-telemetry-amber/30 group-hover:scale-105 transition-transform">
                  <Shield className="w-4 h-4" />
                </div>
                <Badge variant="amber" size="sm" className="text-[10px]">
                  HIGH MARGINS
                </Badge>
              </div>
              <h4 className="font-heading uppercase text-sm font-bold text-white mb-1 group-hover:text-telemetry-amber transition-colors">
                Safest / Redundant
              </h4>
              <p className="text-[11px] text-slate-300 font-body leading-relaxed">
                Maximizes mass &amp; power headroom with dual fault-tolerant avionics and heavy-lift launcher certification.
              </p>
            </button>

            {/* Best Science */}
            <button
              type="button"
              onClick={() => {
                handleRunAutoDesign("best-science");
                setAutoModalOpen(false);
              }}
              className="p-3.5 rounded border border-space-border hover:border-telemetry-purple bg-black/40 hover:bg-space-panel text-left flex flex-col transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded bg-telemetry-purple/10 text-telemetry-purple border border-telemetry-purple/30 group-hover:scale-105 transition-transform">
                  <Star className="w-4 h-4" />
                </div>
                <Badge variant="info" size="sm" className="text-[10px]">
                  MAX SCIENCE
                </Badge>
              </div>
              <h4 className="font-heading uppercase text-sm font-bold text-white mb-1 group-hover:text-telemetry-purple transition-colors">
                Best Science
              </h4>
              <p className="text-[11px] text-slate-300 font-body leading-relaxed">
                Maximizes instrument suites, fine pointing stability, and high-throughput Ka-band telemetry return.
              </p>
            </button>
          </div>

          {lastRationale && (
            <div className="p-3 rounded bg-space-bg border border-space-border text-[11px] text-slate-300 flex flex-col gap-1">
              <span className="font-heading uppercase text-telemetry-amber font-semibold block mb-0.5">
                LAST SYNTHESIS SUMMARY:
              </span>
              {lastRationale.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

