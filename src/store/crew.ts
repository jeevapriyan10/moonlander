/**
 * MoonLander Crew Mode Bridge Store
 * 
 * Manages multiplayer room state, role assignment, host-authoritative operational sync,
 * AI advisor seating, live proposals, votes, and resource asks.
 */

import { create } from "zustand";
import {
  type CrewRole,
  type CrewMode,
  type CrewPeer,
  type CrewOp,
  type CrewProposal,
  type ResourceAsk,
  type TeamCoordinationScore,
  type VoteChoice,
  CREW_ROLES,
  applyOpToAuthoritativeState,
  evaluateProposalVotes,
  calculateTeamCoordinationScore,
  getDailyChallenge,
} from "@/engine/crew";
import { getDefaultMissionConfig } from "@/store/mission";
import { evaluateMission, type MissionDesignConfig } from "@/engine/evaluate";
import { createCatalogLookup } from "@/data";
import {
  generateRoomCode,
  connectCrewChannel,
  type CrewChannel,
  type RealtimeEvent,
} from "@/lib/crew/realtime";
import { useProfileStore } from "./profile";

export interface CrewStoreState {
  roomCode: string | null;
  mode: CrewMode;
  isHost: boolean;
  myRole: CrewRole;
  myPeerId: string;
  peers: CrewPeer[];
  aiRoles: CrewRole[];
  aiAdvisorsActive: boolean;
  sharedConfig: MissionDesignConfig;
  version: number;
  opLog: CrewOp[];
  proposals: CrewProposal[];
  resourceAsks: ResourceAsk[];
  activeProposalId: string | null;
  decisionTimerSeconds: number | null;
  coordinationScore: TeamCoordinationScore | null;
  isConnected: boolean;
  missionStarted: boolean;
  channel: CrewChannel | null;

  // Actions
  createRoom: (
    roomCode: string,
    scenarioId?: string,
    initialRole?: CrewRole,
    mode?: CrewMode,
    seedOverride?: string
  ) => Promise<string>;
  joinRoom: (code: string, preferredRole?: CrewRole) => Promise<boolean>;
  startMission: () => void;
  selectRole: (role: CrewRole) => void;
  toggleReady: () => void;
  setActivePanel: (panel: string) => void;
  submitOp: (patch: Partial<MissionDesignConfig>) => Promise<boolean>;
  submitProposal: (title: string, description: string, patch: Partial<MissionDesignConfig>) => void;
  castVote: (proposalId: string, vote: VoteChoice) => void;
  submitResourceAsk: (
    toRole: CrewRole,
    resource: "power" | "mass" | "budget" | "deltav",
    deltaValue: number,
    rationale: string
  ) => void;
  respondToResourceAsk: (askId: string, approved: boolean) => void;
  leaveRoom: () => void;
  evaluateFinalScore: () => TeamCoordinationScore;
}

export const useCrewStore = create<CrewStoreState>((set, get) => {
  const initialConfig = getDefaultMissionConfig("earth-watch", "INTERMEDIATE", false);
  const myPeerId = `peer-${Math.random().toString(36).substring(2, 9)}`;

  // Handle incoming broadcast events
  const handleRealtimeEvent = (event: RealtimeEvent) => {
    const state = get();

    if (event.type === "OP") {
      const isHost = state.isHost;
      if (isHost) {
        // Host authoritative evaluation
        const res = applyOpToAuthoritativeState(
          state.sharedConfig,
          state.version,
          state.opLog,
          event.op,
          false
        );

        if (res.success) {
          const updatedOp = { ...event.op, resultingVersion: res.newVersion };
          const updatedLog = [...state.opLog, updatedOp];
          set({
            sharedConfig: res.newConfig,
            version: res.newVersion,
            opLog: updatedLog,
          });

          // Broadcast state sync to all peers
          state.channel?.sendEvent({
            type: "STATE_SYNC",
            config: res.newConfig,
            version: res.newVersion,
            opLog: updatedLog,
          });
        }
      }
    } else if (event.type === "STATE_SYNC") {
      // Non-host updates state from host
      if (!state.isHost) {
        set({
          sharedConfig: event.config,
          version: event.version,
          opLog: event.opLog,
        });
      }
    } else if (event.type === "PROPOSAL") {
      set((s) => ({ proposals: [event.proposal, ...s.proposals] }));
    } else if (event.type === "VOTE") {
      set((s) => {
        const updated = s.proposals.map((p) => {
          if (p.id !== event.proposalId) return p;
          const votes = { ...p.votes, [event.role]: event.vote };
          const resolution = evaluateProposalVotes({ ...p, votes });
          return {
            ...p,
            votes,
            status: resolution.status,
            resolutionReason: resolution.reason,
          };
        });
        return { proposals: updated };
      });
    } else if (event.type === "RESOURCE_ASK") {
      set((s) => ({ resourceAsks: [event.ask, ...s.resourceAsks] }));
    } else if (event.type === "RESOURCE_RESPONSE") {
      set((s) => ({
        resourceAsks: s.resourceAsks.map((a) =>
          a.id === event.askId ? { ...a, status: event.approved ? "approved" : "declined" } : a
        ),
      }));
    } else if (event.type === "MISSION_START") {
      set({ missionStarted: true });
    } else if (event.type === "HOST_MIGRATION") {
      if (event.newHostId === state.myPeerId) {
        set({ isHost: true });
      }
    }
  };

  const handlePresenceChange = (peers: CrewPeer[]) => {
    // Determine unoccupied seats for AI advisors
    const humanRoles = new Set(peers.map((p) => p.role));
    const allRoles: CrewRole[] = [
      "MISSION_DIRECTOR",
      "SPACECRAFT_ENGINEER",
      "FLIGHT_DYNAMICS",
      "COMMS_FINANCE",
    ];
    const aiRoles = allRoles.filter((r) => !humanRoles.has(r));

    // Check if host disconnected and trigger host migration
    const hasHost = peers.some((p) => p.isHost);
    let isHost = get().isHost;

    if (!hasHost && peers.length > 0) {
      // First peer in sorted order becomes the new host
      const sortedPeers = [...peers].sort((a, b) => a.id.localeCompare(b.id));
      if (sortedPeers[0]?.id === get().myPeerId) {
        isHost = true;
        get().channel?.sendEvent({
          type: "HOST_MIGRATION",
          newHostId: get().myPeerId,
          newHostCallsign: useProfileStore.getState().profile.callsign,
        });
      }
    }

    set({ peers, aiRoles, aiAdvisorsActive: aiRoles.length > 0, isHost });
  };

  return {
    roomCode: null,
    mode: "coop",
    isHost: false,
    myRole: "MISSION_DIRECTOR",
    myPeerId,
    peers: [],
    aiRoles: ["SPACECRAFT_ENGINEER", "FLIGHT_DYNAMICS", "COMMS_FINANCE"],
    aiAdvisorsActive: true,
    sharedConfig: initialConfig,
    version: 0,
    opLog: [],
    proposals: [],
    resourceAsks: [],
    activeProposalId: null,
    decisionTimerSeconds: null,
    coordinationScore: null,
    isConnected: false,
    missionStarted: false,
    channel: null,

    createRoom: async (
      roomCode?: string,
      scenarioId = "earth-watch",
      initialRole: CrewRole = "MISSION_DIRECTOR",
      mode: CrewMode = "coop",
      seedOverride?: string
    ) => {
      const code = roomCode || generateRoomCode();
      let config = getDefaultMissionConfig(scenarioId, "INTERMEDIATE", false);

      if (seedOverride) {
        config = {
          ...config,
          seed: seedOverride,
        };
      } else if (mode === "daily") {
        const challenge = getDailyChallenge();
        config = {
          ...getDefaultMissionConfig(challenge.scenarioId, challenge.difficulty, false),
          seed: challenge.seed,
        };
      }

      const myCallsign = useProfileStore.getState().profile.callsign || "Commander";
      const myPeer: CrewPeer = {
        id: myPeerId,
        callsign: myCallsign,
        role: initialRole,
        isHost: true,
        isReady: false,
        isAiAdvisor: false,
        lastActive: Date.now(),
      };

      const channel = connectCrewChannel(
        code,
        myPeer,
        handleRealtimeEvent,
        handlePresenceChange
      );

      set({
        roomCode: code,
        mode,
        isHost: true,
        myRole: initialRole,
        sharedConfig: config,
        version: 0,
        opLog: [],
        missionStarted: false,
        isConnected: true,
        channel,
      });

      return code;
    },

    startMission: () => {
      set({ missionStarted: true });
      get().channel?.sendEvent({ type: "MISSION_START" });
    },

    joinRoom: async (code: string, preferredRole: CrewRole = "SPACECRAFT_ENGINEER") => {
      const normalized = code.trim().toUpperCase();
      const myCallsign = useProfileStore.getState().profile.callsign || "Cadet";

      const myPeer: CrewPeer = {
        id: myPeerId,
        callsign: myCallsign,
        role: preferredRole,
        isHost: false,
        isReady: false,
        isAiAdvisor: false,
        lastActive: Date.now(),
      };

      const channel = connectCrewChannel(
        normalized,
        myPeer,
        handleRealtimeEvent,
        handlePresenceChange
      );

      set({
        roomCode: normalized,
        isHost: false,
        myRole: preferredRole,
        isConnected: true,
        channel,
      });

      return true;
    },

    selectRole: (role: CrewRole) => {
      set({ myRole: role });
      get().channel?.updatePresence({ role });
    },

    toggleReady: () => {
      const current = get().peers.find((p) => p.id === myPeerId)?.isReady ?? false;
      get().channel?.updatePresence({ isReady: !current });
    },

    setActivePanel: (panel: string) => {
      get().channel?.updatePresence({ activePanel: panel, lastActive: Date.now() });
    },

    submitOp: async (patch: Partial<MissionDesignConfig>) => {
      const state = get();
      const op: CrewOp = {
        opId: `op-${Math.random().toString(36).substring(2, 9)}`,
        role: state.myRole,
        clientId: state.myPeerId,
        clientCallsign: useProfileStore.getState().profile.callsign || "Pilot",
        patch,
        baseVersion: state.version,
        resultingVersion: state.version + 1,
        timestamp: Date.now(),
      };

      if (state.isHost) {
        // Host applies immediately
        const res = applyOpToAuthoritativeState(
          state.sharedConfig,
          state.version,
          state.opLog,
          op,
          false
        );

        if (res.success) {
          const updatedLog = [...state.opLog, { ...op, resultingVersion: res.newVersion }];
          set({
            sharedConfig: res.newConfig,
            version: res.newVersion,
            opLog: updatedLog,
          });

          await state.channel?.sendEvent({
            type: "STATE_SYNC",
            config: res.newConfig,
            version: res.newVersion,
            opLog: updatedLog,
          });
          return true;
        }
        return false;
      } else {
        // Non-host sends OP to host for authoritative sequencing
        await state.channel?.sendEvent({ type: "OP", op });
        return true;
      }
    },

    submitProposal: (title: string, description: string, patch: Partial<MissionDesignConfig>) => {
      const state = get();
      const proposal: CrewProposal = {
        id: `prop-${Math.random().toString(36).substring(2, 9)}`,
        proposerRole: state.myRole,
        proposerCallsign: useProfileStore.getState().profile.callsign || "Pilot",
        title,
        description,
        affectedFields: Object.keys(patch) as (keyof MissionDesignConfig)[],
        patch,
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000, // 60-second voting window
        status: "pending",
        votes: {
          [state.myRole]: "yes", // Proposer automatically votes yes
        },
      };

      set((s) => ({ proposals: [proposal, ...s.proposals] }));
      state.channel?.sendEvent({ type: "PROPOSAL", proposal });
    },

    castVote: (proposalId: string, vote: VoteChoice) => {
      const state = get();
      set((s) => {
        const updated = s.proposals.map((p) => {
          if (p.id !== proposalId) return p;
          const votes = { ...p.votes, [state.myRole]: vote };
          const resolution = evaluateProposalVotes({ ...p, votes });
          return {
            ...p,
            votes,
            status: resolution.status,
            resolutionReason: resolution.reason,
          };
        });
        return { proposals: updated };
      });

      state.channel?.sendEvent({
        type: "VOTE",
        proposalId,
        role: state.myRole,
        vote,
      });

      // If host and proposal just approved, apply patch to sharedConfig
      const proposal = get().proposals.find((p) => p.id === proposalId);
      if (state.isHost && proposal?.status === "approved") {
        get().submitOp(proposal.patch);
      }
    },

    submitResourceAsk: (
      toRole: CrewRole,
      resource: "power" | "mass" | "budget" | "deltav",
      deltaValue: number,
      rationale: string
    ) => {
      const state = get();
      const units = {
        power: "Watts",
        mass: "kg",
        budget: "Million USD",
        deltav: "m/s",
      };

      const ask: ResourceAsk = {
        id: `ask-${Math.random().toString(36).substring(2, 9)}`,
        fromRole: state.myRole,
        toRole,
        resource,
        deltaValue,
        unit: units[resource],
        rationale,
        createdAt: Date.now(),
        status: "open",
      };

      set((s) => ({ resourceAsks: [ask, ...s.resourceAsks] }));
      state.channel?.sendEvent({ type: "RESOURCE_ASK", ask });
    },

    respondToResourceAsk: (askId: string, approved: boolean) => {
      const state = get();
      set((s) => ({
        resourceAsks: s.resourceAsks.map((a) =>
          a.id === askId ? { ...a, status: approved ? "approved" : "declined" } : a
        ),
      }));

      state.channel?.sendEvent({
        type: "RESOURCE_RESPONSE",
        askId,
        approved,
      });
    },

    leaveRoom: () => {
      const channel = get().channel;
      if (channel) {
        channel.unsubscribe();
      }
      set({
        roomCode: null,
        isConnected: false,
        missionStarted: false,
        channel: null,
        peers: [],
        opLog: [],
        proposals: [],
        resourceAsks: [],
      });
    },

    evaluateFinalScore: () => {
      const state = get();
      const catalog = createCatalogLookup();
      const evalRes = evaluateMission(state.sharedConfig, catalog);

      const score = calculateTeamCoordinationScore({
        opLog: state.opLog,
        proposals: state.proposals,
        evaluation: evalRes,
      });

      set({ coordinationScore: score });
      return score;
    },
  };
});
