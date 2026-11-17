"use client";

import React, { useState } from "react";
import { useCrewStore } from "@/store/crew";
import { RoleBadge } from "./RoleBadge";
import { CREW_ROLES, type CrewRole } from "@/engine/crew/types";
import {
  Users,
  Copy,
  Check,
  Crown,
  Bot,
  Play,
  RotateCcw,
  CheckCircle,
  Clock,
  Radio,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface CrewLobbyProps {
  onStartMission: () => void;
  onLeave: () => void;
}

export const CrewLobby: React.FC<CrewLobbyProps> = ({
  onStartMission,
  onLeave,
}) => {
  const {
    roomCode,
    isHost,
    peers,
    myPeerId,
    myRole,
    mode,
    selectRole,
    toggleReady,
    aiAdvisorsActive,
  } = useCrewStore();

  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const myPeer = peers.find((p) => p.id === myPeerId);
  const isReady = myPeer?.isReady ?? false;
  const allReady = peers.length > 0 && peers.every((p) => p.isReady || p.isAiAdvisor);

  const rolesList: CrewRole[] = [
    "MISSION_DIRECTOR",
    "SPACECRAFT_ENGINEER",
    "FLIGHT_DYNAMICS",
    "COMMS_FINANCE",
  ];

  return (
    <div className="max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6 font-mono text-slate-200">
      {/* Lobby Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-space-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="amber" size="sm">
              MULTIPLAYER CREW MODE // STAGE 3
            </Badge>
            <Badge variant="neutral" size="sm" className="uppercase">
              {mode} MISSION
            </Badge>
          </div>
          <h1 className="text-3xl font-heading uppercase tracking-widest text-white font-bold">
            Flight Operations Crew Room
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Distribute spacecraft subsystems among real-time specialists. Host maintains telemetry authority.
          </p>
        </div>

        {/* 4-Letter Room Code Card */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/60 border border-telemetry-amber/40 shadow-glow-amber">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 tracking-wider uppercase font-bold">
              Room Code
            </span>
            <span className="text-2xl font-heading font-black tracking-widest text-telemetry-amber">
              {roomCode}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            className="p-2 rounded bg-telemetry-amber/20 hover:bg-telemetry-amber/30 text-telemetry-amber border border-telemetry-amber/40 transition-all"
            title="Copy 4-Letter Code"
          >
            {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 4-Seat Role Selection Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-heading uppercase text-xs font-bold text-gray-300 tracking-wider">
            FLIGHT DECK SEAT ASSIGNMENTS
          </span>
          <span className="text-[11px] text-gray-400">
            {peers.length} of 4 Officers Present
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rolesList.map((role) => {
            const def = CREW_ROLES[role];
            const occupant = peers.find((p) => p.role === role);
            const isMySeat = myRole === role;

            return (
              <div
                key={role}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                  isMySeat
                    ? "bg-space-panel/90 border-telemetry-amber shadow-glow-amber"
                    : occupant
                    ? "bg-space-panel/60 border-space-border"
                    : "bg-black/30 border-dashed border-space-border hover:border-gray-500"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <RoleBadge role={role} size="md" />
                    {occupant?.isHost && (
                      <span className="flex items-center gap-1 text-[10px] text-telemetry-amber font-bold">
                        <Crown className="w-3.5 h-3.5" />
                        <span>HOST</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {def.description}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-gray-400">Subsystems:</span>
                    {def.ownedFields.map((f) => (
                      <span
                        key={String(f)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-space-border text-gray-300"
                      >
                        {String(f)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-space-border/60 pt-3">
                  {occupant ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-telemetry-green animate-pulse" />
                      <span className="font-heading font-bold text-sm text-white">
                        {occupant.callsign}
                      </span>
                      {occupant.id === myPeerId && (
                        <span className="text-[10px] text-telemetry-amber">(YOU)</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      {aiAdvisorsActive ? (
                        <span className="flex items-center gap-1 text-blue-400 text-[11px]">
                          <Bot className="w-3.5 h-3.5" />
                          <span>AI Advisory Assist</span>
                        </span>
                      ) : (
                        <span>Seat Vacant</span>
                      )}
                    </div>
                  )}

                  {!isMySeat && !occupant && (
                    <button
                      onClick={() => selectRole(role)}
                      className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-heading uppercase transition-all"
                    >
                      Take Seat
                    </button>
                  )}

                  {occupant && (
                    <Badge
                      variant={occupant.isReady ? "nominal" : "neutral"}
                      size="sm"
                    >
                      {occupant.isReady ? "READY" : "PREPARING"}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lobby Bottom Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-space-border pt-6">
        <Button
          variant="outline"
          size="md"
          onClick={onLeave}
          className="flex items-center gap-1.5 w-full md:w-auto"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Exit to Flight Deck</span>
        </Button>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Ready Toggle */}
          <button
            onClick={toggleReady}
            className={`flex-1 md:flex-initial px-4 py-2 rounded font-heading font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 ${
              isReady
                ? "bg-telemetry-green text-black border border-telemetry-green shadow-glow-green"
                : "bg-white/10 text-white border border-white/30 hover:bg-white/20"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isReady ? "Ready for Launch" : "Mark as Ready"}</span>
          </button>

          {/* Start Mission Button (Host only) */}
          {isHost && (
            <Button
              variant="primary"
              size="md"
              onClick={onStartMission}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>Engage Mission</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
