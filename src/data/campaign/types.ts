/**
 * Meridian Space Authority (MSA) Campaign Data Definitions
 * Year: 2041
 */

import { z } from "zod";

export type CharacterId = "okafor" | "arai" | "ferreira" | "hale";

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  callsign: string;
  role: string;
  bio: string;
  accentColor: string;
}

export const CHARACTERS: Record<CharacterId, CharacterProfile> = {
  okafor: {
    id: "okafor",
    name: "Imani Okafor",
    callsign: "Director",
    role: "Director of Flight Operations",
    bio: "Former shuttle commander and aerospace diplomat. Pragmatic, steadfast, and dedicated to restoring the Authority's standing after the loss of the Meridian-1 flagship.",
    accentColor: "#38bdf8",
  },
  arai: {
    id: "arai",
    name: "Kenji Arai",
    callsign: "Chief",
    role: "Chief Spacecraft Engineer",
    bio: "Obsessed with mass margins, thermal dissipation, and redundant avionics. His motto: 'A nominal margin is an engineer's peace of mind.'",
    accentColor: "#f59e0b",
  },
  ferreira: {
    id: "ferreira",
    name: "Dr. Lucia Ferreira",
    callsign: "Principal",
    role: "Lead Astrophysicist & Science Director",
    bio: "World authority on exoplanet transit spectroscopy. Impatient with bureaucratic delays when new planetary atmospheres are waiting to be decoded.",
    accentColor: "#a855f7",
  },
  hale: {
    id: "hale",
    name: "Arthur Hale",
    callsign: "Auditor",
    role: "Treasury Liaison & Oversight Officer",
    bio: "Appointed by the civilian budget council. Measures every orbital maneuver in lifecycle dollars and public return on investment.",
    accentColor: "#10b981",
  },
};

export interface ReputationState {
  science: number;   // 0 - 100
  public: number;    // 0 - 100
  treasury: number;  // 0 - 100
}

export type ScriptNodeType = "say" | "choice" | "grant" | "goto";

export interface SayNode {
  type: "say";
  speaker: CharacterId;
  text: string;
  audioCue?: "chime" | "warning" | "pulse";
  nextNodeId?: string;
}

export interface ChoiceOption {
  label: string;
  description: string;
  effects: {
    rep?: Partial<ReputationState>;
    reputation?: Partial<ReputationState>;
    budgetDeltaM?: number;
    deadlineDeltaMonths?: number;
  };
  nextNodeId: string;
}

export interface ChoiceNode {
  type: "choice";
  prompt: string;
  speaker?: CharacterId;
  options: ChoiceOption[];
}

export interface GrantNode {
  type: "grant";
  xp: number;
  achievementId?: string;
  nextNodeId: string;
}

export interface GotoNode {
  type: "goto";
  nextNodeId: string;
}

export type ScriptNode = SayNode | ChoiceNode | GrantNode | GotoNode;

export interface DialogScene {
  startNodeId: string;
  nodes: Record<string, ScriptNode>;
}

export interface CampaignChapter {
  id: string;
  act: number; // 0: Prologue, 1: Act I Earth, 2: Act II Moon, 3: Act III Worlds
  order: number;
  title: string;
  subtitle: string;
  briefingDate: string; // "May 14, 2041"
  summary: string;
  linkedScenarioId: string;
  requiredReputation?: Partial<ReputationState>;
  rewards: {
    xp: number;
    reputation: Partial<ReputationState>;
    unlockScenarioId?: string;
  };
  briefing: DialogScene;
  epilogue: {
    success: DialogScene;
    partial: DialogScene;
    failure: DialogScene;
  };
}
