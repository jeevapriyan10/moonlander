"use client";

import React from "react";
import { useCrewStore } from "@/store/crew";
import { RoleBadge } from "./RoleBadge";
import { Crown, Bot, Wifi, WifiOff } from "lucide-react";

export const PresenceOverlay: React.FC = () => {
  const { peers, myPeerId, aiAdvisorsActive, roomCode, isHost } = useCrewStore();

  if (!roomCode) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 px-3 bg-space-panel/80 border-b border-space-border text-xs font-mono">
      <div className="flex items-center gap-1.5 text-gray-400 shrink-0 mr-1">
        <Wifi className="w-3.5 h-3.5 text-telemetry-green animate-pulse" />
        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-300">
          ROOM: <span className="text-telemetry-amber font-heading text-xs">{roomCode}</span>
        </span>
      </div>

      <div className="h-4 w-px bg-space-border mx-1 shrink-0" />

      {/* Roster of connected peers */}
      <div className="flex items-center gap-2">
        {peers.map((peer) => {
          const isMe = peer.id === myPeerId;
          return (
            <div
              key={peer.id}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] transition-all ${
                isMe
                  ? "bg-white/10 border-white/30 text-white"
                  : "bg-black/40 border-space-border text-gray-300"
              }`}
            >
              {peer.isHost && (
                <span title="Room Host">
                  <Crown className="w-3 h-3 text-telemetry-amber" />
                </span>
              )}
              <span className="font-semibold">{peer.callsign}</span>
              {isMe && <span className="text-[9px] text-gray-400">(YOU)</span>}
              <RoleBadge role={peer.role} size="sm" />
              {peer.activePanel && (
                <span className="text-[9px] text-gray-400 font-normal">
                  [{peer.activePanel}]
                </span>
              )}
            </div>
          );
        })}

        {aiAdvisorsActive && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-300 text-[10px]">
            <Bot className="w-3 h-3" />
            <span>AI SEAT ASSIST ACTIVE</span>
          </div>
        )}
      </div>
    </div>
  );
};
