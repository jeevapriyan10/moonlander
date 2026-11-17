/**
 * MoonLander Crew Mode Types & Role Contracts
 * 
 * Supports up to 4 collaborative players:
 * 1. MISSION_DIRECTOR: Mission Objective, Payload & Instrument selection, tie-breaker
 * 2. SPACECRAFT_ENGINEER: Bus class, Thermal control, ADCS, Flight Computer, Power sizing
 * 3. FLIGHT_DYNAMICS: Orbit selection, Launcher selection, Propulsion type & Propellant mass
 * 4. COMMS_FINANCE: Ground Network, Comms hardware, Onboard Storage, Budget cap compliance
 */

import type { MissionDesignConfig } from "../evaluate";

export type CrewRole =
  | "MISSION_DIRECTOR"
  | "SPACECRAFT_ENGINEER"
  | "FLIGHT_DYNAMICS"
  | "COMMS_FINANCE";

export type CrewMode = "coop" | "competitive" | "daily";

export interface RoleDefinition {
  id: CrewRole;
  title: string;
  shortTitle: string;
  badge: string;
  color: string;
  description: string;
  ownedFields: (keyof MissionDesignConfig)[];
  primaryResponsibility: string;
}

export const CREW_ROLES: Record<CrewRole, RoleDefinition> = {
  MISSION_DIRECTOR: {
    id: "MISSION_DIRECTOR",
    title: "Mission Director / Principal Investigator",
    shortTitle: "Director",
    badge: "DIR",
    color: "#f59e0b", // Amber
    description: "Sets mission goals, selects scientific instruments, and exercises tie-breaker authority.",
    ownedFields: ["name", "scenarioId", "difficulty", "selectedInstrumentIds"],
    primaryResponsibility: "Payload & Science Targets",
  },
  SPACECRAFT_ENGINEER: {
    id: "SPACECRAFT_ENGINEER",
    title: "Chief Spacecraft Engineer",
    shortTitle: "Engineer",
    badge: "ENG",
    color: "#06b6d4", // Cyan
    description: "Architects the bus structure, thermal subsystem, attitude control, computing, and electrical power.",
    ownedFields: [
      "busId",
      "solarArrayId",
      "solarArrayAreaM2",
      "batteryId",
      "batteryCapacityWh",
      "adcsId",
      "flightComputerId",
      "thermalId",
    ],
    primaryResponsibility: "Power, Mass, & Hardware Systems",
  },
  FLIGHT_DYNAMICS: {
    id: "FLIGHT_DYNAMICS",
    title: "Flight Dynamics & Launch Officer",
    shortTitle: "FDO",
    badge: "FDO",
    color: "#10b981", // Emerald
    description: "Determines target orbital regime, selects the launch vehicle, and sizes delta-v propulsion budgets.",
    ownedFields: ["orbitId", "launcherId", "propulsionId", "propellantMassKg"],
    primaryResponsibility: "Trajectory, Delta-V, & Launch Vehicle",
  },
  COMMS_FINANCE: {
    id: "COMMS_FINANCE",
    title: "Communications & Mission Comptroller",
    shortTitle: "Finance",
    badge: "COM",
    color: "#a855f7", // Purple
    description: "Selects telecommunications transceivers, ground networks, data storage, and audits budget caps.",
    ownedFields: ["commsId", "groundNetworkId", "storageGb"],
    primaryResponsibility: "Telemetry Downlink & Budget Compliance",
  },
};

/**
 * Maps each design configuration field to its authoritative role owner.
 */
export const FIELD_ROLE_OWNERSHIP: Record<keyof MissionDesignConfig, CrewRole> = {
  id: "MISSION_DIRECTOR",
  seed: "MISSION_DIRECTOR",
  name: "MISSION_DIRECTOR",
  scenarioId: "MISSION_DIRECTOR",
  difficulty: "MISSION_DIRECTOR",
  isSandbox: "MISSION_DIRECTOR",
  selectedInstrumentIds: "MISSION_DIRECTOR",

  busId: "SPACECRAFT_ENGINEER",
  solarArrayId: "SPACECRAFT_ENGINEER",
  solarArrayAreaM2: "SPACECRAFT_ENGINEER",
  batteryId: "SPACECRAFT_ENGINEER",
  batteryCapacityWh: "SPACECRAFT_ENGINEER",
  adcsId: "SPACECRAFT_ENGINEER",
  flightComputerId: "SPACECRAFT_ENGINEER",
  thermalId: "SPACECRAFT_ENGINEER",

  orbitId: "FLIGHT_DYNAMICS",
  launcherId: "FLIGHT_DYNAMICS",
  propulsionId: "FLIGHT_DYNAMICS",
  propellantMassKg: "FLIGHT_DYNAMICS",

  commsId: "COMMS_FINANCE",
  groundNetworkId: "COMMS_FINANCE",
  storageGb: "COMMS_FINANCE",
};

/**
 * Versioned Operation Log Item
 */
export interface CrewOp {
  opId: string;
  role: CrewRole;
  clientId: string;
  clientCallsign: string;
  patch: Partial<MissionDesignConfig>;
  baseVersion: number;
  resultingVersion: number;
  timestamp: number;
}

export type VoteChoice = "yes" | "no" | "abstain";

/**
 * Negotiation Proposal
 */
export interface CrewProposal {
  id: string;
  proposerRole: CrewRole;
  proposerCallsign: string;
  title: string;
  description: string;
  affectedFields: (keyof MissionDesignConfig)[];
  patch: Partial<MissionDesignConfig>;
  createdAt: number;
  expiresAt?: number;
  status: "pending" | "approved" | "rejected" | "expired";
  votes: Partial<Record<CrewRole, VoteChoice>>;
  resolutionReason?: string;
}

/**
 * Inter-Role Resource Asks
 */
export type ResourceType = "power" | "mass" | "budget" | "deltav";

export interface ResourceAsk {
  id: string;
  fromRole: CrewRole;
  toRole: CrewRole;
  resource: ResourceType;
  deltaValue: number;
  unit: string;
  rationale: string;
  createdAt: number;
  status: "open" | "approved" | "declined";
}

/**
 * Player Peer Presence
 */
export interface CrewPeer {
  id: string;
  callsign: string;
  role: CrewRole;
  isHost: boolean;
  isReady: boolean;
  isAiAdvisor: boolean;
  activePanel?: string;
  lastActive: number;
}

/**
 * Deterministic Team Coordination Score Breakdown (Max 15 pts)
 */
export interface TeamCoordinationScore {
  totalPoints: number; // 0 to 15
  breakdown: {
    balancedContribution: number; // 0 to 5 pts
    disputeResolutionSpeed: number; // 0 to 4 pts
    vetoPenalty: number; // 0 to 3 pts (subtracted)
    marginAgreement: number; // 0 to 3 pts
  };
  summary: string;
}
