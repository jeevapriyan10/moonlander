"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCrewStore } from "@/store/crew";
import { getDailyChallenge } from "@/engine/crew/daily";
import { generateRoomCode, isValidRoomCode } from "@/lib/crew/realtime";
import { RoleBadge } from "@/components/crew/RoleBadge";
import { CREW_ROLES, type CrewRole } from "@/engine/crew/types";
import {
  Users,
  PlusCircle,
  LogIn,
  Calendar,
  Compass,
  ArrowRight,
  ShieldAlert,
  Flame,
  Globe,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function CrewHubPage() {
  const router = useRouter();
  const { createRoom, joinRoom } = useCrewStore();

  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [preferredRole, setPreferredRole] = useState<CrewRole>("SPACECRAFT_ENGINEER");
  const [selectedMode, setSelectedMode] = useState<"coop" | "competitive">("coop");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Daily Challenge for today
  const dailyChallenge = getDailyChallenge();

  const handleCreateRoom = async () => {
    setErrorMsg(null);
    const code = generateRoomCode();
    await createRoom(code, "earth-watch", preferredRole, selectedMode);
    router.push(`/crew/${code}`);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const normalized = joinCodeInput.trim().toUpperCase();
    if (!isValidRoomCode(normalized)) {
      setErrorMsg("Room code must be a 4-letter alphanumeric string (e.g. ARES, ORBT).");
      return;
    }

    await joinRoom(normalized, preferredRole);
    router.push(`/crew/${normalized}`);
  };

  const handleLaunchDailyChallenge = async () => {
    setErrorMsg(null);
    const code = generateRoomCode();
    await createRoom(
      code,
      dailyChallenge.scenarioId,
      "MISSION_DIRECTOR",
      "daily",
      dailyChallenge.seed
    );
    router.push(`/crew/${code}`);
  };

  return (
    <div className="min-h-screen bg-space-bg flex flex-col p-4 md:p-8 font-mono text-slate-200">
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-8">
        {/* Hub Header */}
        <div className="flex flex-col gap-2 border-b border-space-border pb-6">
          <div className="flex items-center gap-2">
            <Badge variant="amber" size="sm">
              STAGE 3 // REALTIME SQUADRONS
            </Badge>
            <Badge variant="info" size="sm">
              UP TO 4 PLAYERS
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading uppercase tracking-widest text-white font-bold">
            MoonLander Crew Command
          </h1>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            Collaborate in real time to architect, integrate, and pilot deep space missions.
            Roles hold authoritative ownership of subsystems: Payload, Bus Engineering, Trajectory & Propulsion, and Comms & Budget.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded border border-red-500/40 bg-red-500/10 flex items-center gap-2 text-xs text-red-300">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Grid: Create Room, Join Room, Daily Challenge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Create New Room */}
          <div className="p-6 rounded-xl border border-space-border bg-space-panel/90 flex flex-col justify-between gap-5 hover:border-telemetry-amber transition-all">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-telemetry-amber/20 border border-telemetry-amber/50 flex items-center justify-center text-telemetry-amber">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-heading uppercase tracking-wider text-white font-bold">
                Create Room
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Host a fresh multi-seat mission. Generates a 4-letter room code for your crew mates.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Select Game Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMode("coop")}
                    className={`py-1.5 px-2 rounded border text-xs font-heading uppercase transition-all ${
                      selectedMode === "coop"
                        ? "bg-telemetry-cyan/20 border-telemetry-cyan text-telemetry-cyan"
                        : "bg-black/40 border-space-border text-gray-400 hover:text-white"
                    }`}
                  >
                    Cooperative
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMode("competitive")}
                    className={`py-1.5 px-2 rounded border text-xs font-heading uppercase transition-all ${
                      selectedMode === "competitive"
                        ? "bg-telemetry-amber/20 border-telemetry-amber text-telemetry-amber"
                        : "bg-black/40 border-space-border text-gray-400 hover:text-white"
                    }`}
                  >
                    Competitive
                  </button>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleCreateRoom}
              className="flex items-center justify-center gap-2 w-full"
            >
              <span>Initialize Room</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Card 2: Join Existing Room */}
          <div className="p-6 rounded-xl border border-space-border bg-space-panel/90 flex flex-col justify-between gap-5 hover:border-telemetry-cyan transition-all">
            <form onSubmit={handleJoinRoom} className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-telemetry-cyan/20 border border-telemetry-cyan/50 flex items-center justify-center text-telemetry-cyan">
                <LogIn className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-heading uppercase tracking-wider text-white font-bold">
                Join With Code
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Enter the 4-letter room code provided by your Flight Director to take your station.
              </p>

              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider">
                  4-Letter Room Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. ARES"
                  className="w-full px-3 py-2 bg-black/60 border border-space-border rounded text-center text-lg font-mono font-bold tracking-widest text-telemetry-cyan focus:outline-none focus:border-telemetry-cyan uppercase"
                  required
                />
              </div>

              <Button
                variant="outline"
                size="md"
                type="submit"
                className="flex items-center justify-center gap-2 w-full mt-2"
              >
                <span>Enter Room</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Card 3: Daily Challenge */}
          <div className="p-6 rounded-xl border border-purple-500/40 bg-purple-950/20 flex flex-col justify-between gap-5 hover:border-purple-400 transition-all">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400">
                  <Flame className="w-5 h-5" />
                </div>
                <Badge variant="amber" size="sm">
                  SYNCHRONIZED DAILY
                </Badge>
              </div>

              <h2 className="text-xl font-heading uppercase tracking-wider text-white font-bold">
                Daily Challenge
              </h2>

              <div className="p-2.5 rounded bg-black/40 border border-space-border text-xs flex flex-col gap-1">
                <div className="flex justify-between text-gray-400 text-[10px]">
                  <span>DATE (UTC):</span>
                  <span className="text-gray-200">{dailyChallenge.dateString}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-[10px]">
                  <span>SEED:</span>
                  <span className="text-telemetry-amber font-bold">{dailyChallenge.seed}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-[10px]">
                  <span>SCENARIO:</span>
                  <span className="text-telemetry-cyan">{dailyChallenge.scenarioTitle}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed">
                Deterministic daily seed shared by all pilots worldwide. Compete for highest mission score on today&apos;s leaderboard.
              </p>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={handleLaunchDailyChallenge}
              className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-500 text-white"
            >
              <span>Launch Daily Flight</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Roles & Subsystems Briefing Guide */}
        <div className="flex flex-col gap-4 border-t border-space-border pt-6">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-telemetry-amber" />
            <h3 className="text-sm font-heading uppercase tracking-wider text-white font-bold">
              Subsystem Authority & Roster Contracts
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(CREW_ROLES).map((role) => (
              <div
                key={role.id}
                className="p-4 rounded-lg bg-black/40 border border-space-border flex flex-col gap-2"
              >
                <RoleBadge role={role.id} size="sm" />
                <span className="text-xs text-white font-bold font-heading uppercase mt-1">
                  {role.primaryResponsibility}
                </span>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {role.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
