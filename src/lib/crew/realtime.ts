/**
 * MoonLander Crew Realtime Communication & Broadcast Adapter
 * 
 * Supports:
 * - 4-Letter Room Code Generation (clean alphanumeric charset)
 * - Supabase Realtime Broadcast & Presence channels
 * - In-Memory Loopback Mock for 100% offline testing and guest mode
 */

import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { CrewOp, CrewPeer, CrewProposal, ResourceAsk, CrewRole } from "@/engine/crew";
import type { MissionDesignConfig } from "@/engine/evaluate";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omits ambiguous I, O, 0, 1

/**
 * Generates an uppercase 4-character aerospace room code.
 */
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

/**
 * Validates a 4-letter room code.
 */
export function isValidRoomCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim().toUpperCase();
  if (trimmed.length !== 4) return false;
  return /^[A-Z0-9]{4}$/.test(trimmed);
}

export type RealtimeEvent =
  | { type: "OP"; op: CrewOp }
  | { type: "PROPOSAL"; proposal: CrewProposal }
  | { type: "VOTE"; proposalId: string; role: CrewRole; vote: "yes" | "no" | "abstain" }
  | { type: "RESOURCE_ASK"; ask: ResourceAsk }
  | { type: "RESOURCE_RESPONSE"; askId: string; approved: boolean }
  | { type: "STATE_SYNC"; config: MissionDesignConfig; version: number; opLog: CrewOp[] }
  | { type: "MISSION_START" }
  | { type: "HOST_MIGRATION"; newHostId: string; newHostCallsign: string };

export type RealtimeCallback = (event: RealtimeEvent) => void;
export type PresenceCallback = (peers: CrewPeer[]) => void;

export interface CrewChannel {
  sendEvent: (event: RealtimeEvent) => Promise<void>;
  updatePresence: (presence: Partial<CrewPeer>) => Promise<void>;
  unsubscribe: () => void;
}

// In-Memory Shared Bus for Mock/Local Loopback
const mockBus = new Map<string, Set<(event: RealtimeEvent) => void>>();
const mockPresence = new Map<string, Map<string, CrewPeer>>();
const mockPresenceListeners = new Map<string, Set<PresenceCallback>>();

/**
 * Connects to a Crew Realtime channel (Supabase Broadcast or Mock Loopback).
 */
export function connectCrewChannel(
  roomCode: string,
  myPeer: CrewPeer,
  onEvent: RealtimeCallback,
  onPresence: PresenceCallback
): CrewChannel {
  const normalizedCode = roomCode.trim().toUpperCase();
  const supabase = getSupabaseBrowserClient();

  // 1. Live Supabase Realtime Channel
  if (supabase && isSupabaseConfigured()) {
    const channel = supabase.channel(`crew:${normalizedCode}`, {
      config: {
        broadcast: { ack: true, self: false },
        presence: { key: myPeer.id },
      },
    });

    channel
      .on("broadcast", { event: "crew_msg" }, ({ payload }) => {
        if (payload) onEvent(payload as RealtimeEvent);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const peersList: CrewPeer[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key] as any[];
          if (presences && presences[0]) {
            peersList.push(presences[0] as CrewPeer);
          }
        }
        onPresence(peersList);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(myPeer);
        }
      });

    return {
      sendEvent: async (event: RealtimeEvent) => {
        await channel.send({
          type: "broadcast",
          event: "crew_msg",
          payload: event,
        });
      },
      updatePresence: async (updates: Partial<CrewPeer>) => {
        Object.assign(myPeer, updates);
        await channel.track(myPeer);
      },
      unsubscribe: () => {
        channel.unsubscribe();
      },
    };
  }

  // 2. In-Memory Mock Loopback Fallback (Offline / Tests)
  if (!mockBus.has(normalizedCode)) {
    mockBus.set(normalizedCode, new Set());
    mockPresence.set(normalizedCode, new Map());
    mockPresenceListeners.set(normalizedCode, new Set());
  }

  const listeners = mockBus.get(normalizedCode)!;
  const presenceMap = mockPresence.get(normalizedCode)!;
  const pListeners = mockPresenceListeners.get(normalizedCode)!;

  listeners.add(onEvent);
  pListeners.add(onPresence);
  presenceMap.set(myPeer.id, { ...myPeer });

  // Broadcast presence
  const notifyPresence = () => {
    const peers = Array.from(presenceMap.values());
    pListeners.forEach((fn) => fn(peers));
  };
  notifyPresence();

  return {
    sendEvent: async (event: RealtimeEvent) => {
      listeners.forEach((fn) => {
        // Asynchronous dispatch
        setTimeout(() => fn(event), 10);
      });
    },
    updatePresence: async (updates: Partial<CrewPeer>) => {
      Object.assign(myPeer, updates);
      presenceMap.set(myPeer.id, { ...myPeer });
      notifyPresence();
    },
    unsubscribe: () => {
      listeners.delete(onEvent);
      pListeners.delete(onPresence);
      presenceMap.delete(myPeer.id);
      notifyPresence();
    },
  };
}
