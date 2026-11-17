"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCrewStore } from "@/store/crew";
import { CrewLobby } from "@/components/crew/CrewLobby";
import { PresenceOverlay } from "@/components/crew/PresenceOverlay";
import { NegotiationPanel } from "@/components/crew/NegotiationPanel";
import { RoleBadge } from "@/components/crew/RoleBadge";
import { CREW_ROLES, FIELD_ROLE_OWNERSHIP, type CrewRole } from "@/engine/crew/types";
import { evaluateMission, type MissionDesignConfig } from "@/engine/evaluate";
import { createCatalogLookup, buses, orbits, launchers, commsSystems } from "@/data";
import { Dashboard } from "@/components/hud/Dashboard";
import { CatalogPanel } from "@/components/design/CatalogPanel";
import dynamic from "next/dynamic";
import {
  Lock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Trophy,
  Activity,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const Viewport3D = dynamic(
  () => import("@/components/three/Viewport3D").then((mod) => mod.Viewport3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[350px] flex flex-col items-center justify-center bg-space-bg border border-space-border">
        <div className="w-8 h-8 rounded-full border border-telemetry-cyan/30 border-t-telemetry-cyan animate-spin mb-3" />
        <span className="font-mono text-xs text-telemetry-cyan tracking-wider uppercase">
          SYNCHRONIZING CREW TELEMETRY...
        </span>
      </div>
    ),
  }
);

export default function CrewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCodeParam = (params?.code as string)?.toUpperCase() || "";

  const {
    roomCode,
    isConnected,
    joinRoom,
    leaveRoom,
    startMission,
    missionStarted,
    myRole,
    sharedConfig,
    submitOp,
    coordinationScore,
    evaluateFinalScore,
  } = useCrewStore();

  const [activeStage, setActiveStage] = useState<"design" | "debrief">("design");
  const [showScoreModal, setShowScoreModal] = useState(false);

  // Auto-connect to room if navigating directly via URL
  useEffect(() => {
    if (roomCodeParam && (!isConnected || roomCode !== roomCodeParam)) {
      joinRoom(roomCodeParam);
    }
  }, [roomCodeParam, isConnected, roomCode, joinRoom]);

  const handleLeave = () => {
    leaveRoom();
    router.push("/crew");
  };

  const handleFinishMission = () => {
    evaluateFinalScore();
    setShowScoreModal(true);
  };

  // Evaluate current authoritative state
  const catalogLookup = createCatalogLookup();
  const evaluation = evaluateMission(sharedConfig, catalogLookup);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-space-bg flex flex-col items-center justify-center font-mono text-xs text-telemetry-cyan">
        <div className="w-8 h-8 rounded-full border border-telemetry-cyan/30 border-t-telemetry-cyan animate-spin mb-3" />
        <span>JOINING CREW BROADCAST CHANNEL [{roomCodeParam}]...</span>
      </div>
    );
  }

  // If in pre-flight lobby phase
  if (!missionStarted) {
    return (
      <div className="min-h-screen bg-space-bg flex flex-col justify-center">
        <CrewLobby onStartMission={startMission} onLeave={handleLeave} />
      </div>
    );
  }

  // Role permissions check
  const myRoleDef = CREW_ROLES[myRole];

  return (
    <div className="h-screen h-[100dvh] w-full bg-space-bg flex flex-col overflow-hidden text-slate-200 font-body">
      {/* 1. Realtime Presence Overlay Header */}
      <PresenceOverlay />

      {/* 2. Tactical Crew Subsystem Bar */}
      <div className="shrink-0 px-4 py-2 border-b border-space-border bg-space-panel/90 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="font-heading uppercase text-white font-bold tracking-wider">
            {sharedConfig.name}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">YOUR STATION:</span>
            <RoleBadge role={myRole} size="sm" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFinishMission}
            className="flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-telemetry-amber" />
            <span>Score Mission</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeave}
            className="text-gray-400 hover:text-white"
          >
            Leave
          </Button>
        </div>
      </div>

      {/* 3. Main Collaborative Workspace (3 Columns) */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Column: Role Hardware Controls */}
        <div className="w-full md:w-[380px] lg:w-[420px] shrink-0 border-r border-space-border bg-space-panel flex flex-col overflow-y-auto p-4 gap-4">
          <div className="flex items-center justify-between border-b border-space-border pb-2">
            <span className="font-heading uppercase text-xs font-bold text-gray-200">
              Assigned Subsystem Controls
            </span>
            <RoleBadge role={myRole} size="sm" />
          </div>

          <div className="flex flex-col gap-3">
            {/* Bus Selection (SPACECRAFT_ENGINEER) */}
            <div className="flex flex-col gap-1.5 p-3 rounded bg-black/40 border border-space-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading uppercase text-gray-300 font-bold">
                  Spacecraft Bus Frame
                </span>
                {myRole !== "SPACECRAFT_ENGINEER" ? (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Lock className="w-3 h-3 text-telemetry-cyan" />
                    <span>ENGINEER ONLY</span>
                  </span>
                ) : (
                  <Badge variant="nominal" size="sm">YOUR CONTROL</Badge>
                )}
              </div>

              {myRole === "SPACECRAFT_ENGINEER" ? (
                <select
                  value={sharedConfig.busId}
                  onChange={(e) => submitOp({ busId: e.target.value })}
                  className="px-2 py-1.5 rounded bg-black/60 border border-space-border text-xs text-white"
                >
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.structuralMassKg} kg, ${b.baseCostM}M)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-gray-400 font-mono">
                  {buses.find((b) => b.id === sharedConfig.busId)?.name || sharedConfig.busId}
                </div>
              )}
            </div>

            {/* Orbit Selection (FLIGHT_DYNAMICS) */}
            <div className="flex flex-col gap-1.5 p-3 rounded bg-black/40 border border-space-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading uppercase text-gray-300 font-bold">
                  Mission Trajectory Orbit
                </span>
                {myRole !== "FLIGHT_DYNAMICS" ? (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Lock className="w-3 h-3 text-telemetry-green" />
                    <span>FDO ONLY</span>
                  </span>
                ) : (
                  <Badge variant="nominal" size="sm">YOUR CONTROL</Badge>
                )}
              </div>

              {myRole === "FLIGHT_DYNAMICS" ? (
                <select
                  value={sharedConfig.orbitId}
                  onChange={(e) => submitOp({ orbitId: e.target.value })}
                  className="px-2 py-1.5 rounded bg-black/60 border border-space-border text-xs text-white"
                >
                  {orbits.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.regime})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-gray-400 font-mono">
                  {orbits.find((o) => o.id === sharedConfig.orbitId)?.name || sharedConfig.orbitId}
                </div>
              )}
            </div>

            {/* Launch Vehicle Selection (FLIGHT_DYNAMICS) */}
            <div className="flex flex-col gap-1.5 p-3 rounded bg-black/40 border border-space-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading uppercase text-gray-300 font-bold">
                  Launch Vehicle
                </span>
                {myRole !== "FLIGHT_DYNAMICS" ? (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Lock className="w-3 h-3 text-telemetry-green" />
                    <span>FDO ONLY</span>
                  </span>
                ) : (
                  <Badge variant="nominal" size="sm">YOUR CONTROL</Badge>
                )}
              </div>

              {myRole === "FLIGHT_DYNAMICS" ? (
                <select
                  value={sharedConfig.launcherId}
                  onChange={(e) => submitOp({ launcherId: e.target.value })}
                  className="px-2 py-1.5 rounded bg-black/60 border border-space-border text-xs text-white"
                >
                  {launchers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} (${l.priceM}M)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-gray-400 font-mono">
                  {launchers.find((l) => l.id === sharedConfig.launcherId)?.name || sharedConfig.launcherId}
                </div>
              )}
            </div>

            {/* Payload Instruments (MISSION_DIRECTOR) */}
            <div className="flex flex-col gap-1.5 p-3 rounded bg-black/40 border border-space-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading uppercase text-gray-300 font-bold">
                  Payload Instruments
                </span>
                {myRole !== "MISSION_DIRECTOR" ? (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Lock className="w-3 h-3 text-telemetry-amber" />
                    <span>DIRECTOR ONLY</span>
                  </span>
                ) : (
                  <Badge variant="nominal" size="sm">YOUR CONTROL</Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mt-1">
                {sharedConfig.selectedInstrumentIds.map((instId) => (
                  <span
                    key={instId}
                    className="text-[10px] px-2 py-0.5 rounded bg-telemetry-amber/15 border border-telemetry-amber/40 text-telemetry-amber"
                  >
                    {instId}
                  </span>
                ))}
              </div>
            </div>

            {/* Comms Hardware (COMMS_FINANCE) */}
            <div className="flex flex-col gap-1.5 p-3 rounded bg-black/40 border border-space-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading uppercase text-gray-300 font-bold">
                  Communications Subsystem
                </span>
                {myRole !== "COMMS_FINANCE" ? (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Lock className="w-3 h-3 text-purple-400" />
                    <span>FINANCE ONLY</span>
                  </span>
                ) : (
                  <Badge variant="nominal" size="sm">YOUR CONTROL</Badge>
                )}
              </div>

              {myRole === "COMMS_FINANCE" ? (
                <select
                  value={sharedConfig.commsId}
                  onChange={(e) => submitOp({ commsId: e.target.value })}
                  className="px-2 py-1.5 rounded bg-black/60 border border-space-border text-xs text-white"
                >
                  {commsSystems.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.band}, ${c.costM}M)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-gray-400 font-mono">
                  {commsSystems.find((c) => c.id === sharedConfig.commsId)?.name || sharedConfig.commsId}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Column: 3D Telemetry Viewport */}
        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden bg-space-bg">
          <Viewport3D className="w-full h-full min-h-[350px]" />
        </div>

        {/* Right Column: Live Resource Gauges */}
        <div className="w-full md:w-[360px] lg:w-[400px] shrink-0 border-l border-space-border bg-space-panel/95 flex flex-col overflow-y-auto">
          <Dashboard />
        </div>
      </div>

      {/* 4. Negotiation Panel Docked at Bottom */}
      <NegotiationPanel />

      {/* 5. Team Coordination Score Modal */}
      {showScoreModal && coordinationScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-xl border border-telemetry-amber bg-space-panel shadow-2xl flex flex-col gap-4 font-mono text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-telemetry-amber/20 border-2 border-telemetry-amber flex items-center justify-center text-telemetry-amber">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-heading uppercase tracking-widest text-white font-bold">
                Team Coordination Score
              </h2>
              <div className="text-4xl font-heading font-black text-telemetry-amber">
                {coordinationScore.totalPoints} / 15 PTS
              </div>
              <p className="text-xs text-gray-300 italic">
                &quot;{coordinationScore.summary}&quot;
              </p>
            </div>

            <div className="p-3 rounded bg-black/50 border border-space-border text-left text-xs flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Balanced Role Contribution:</span>
                <span className="text-telemetry-cyan font-bold">
                  {coordinationScore.breakdown.balancedContribution} / 5
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Dispute Resolution Speed:</span>
                <span className="text-telemetry-green font-bold">
                  {coordinationScore.breakdown.disputeResolutionSpeed} / 4
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Veto / Reversal Penalty:</span>
                <span className="text-red-400 font-bold">
                  -{coordinationScore.breakdown.vetoPenalty}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Final Margin Agreement:</span>
                <span className="text-purple-400 font-bold">
                  {coordinationScore.breakdown.marginAgreement} / 3
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => setShowScoreModal(false)}
              className="w-full"
            >
              Return to Flight Deck
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
