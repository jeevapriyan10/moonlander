/**
 * Repository Abstraction Interfaces for MoonLander
 * 
 * Provides unified data contracts for Pilot Profiles, Missions, and Mission History.
 * Supports LocalRepository (localStorage + IndexedDB fallback) and ready for
 * future Supabase / cloud sync implementations.
 */

import type { MissionDesignConfig } from "@/engine/evaluate";
import type { DebriefReport } from "@/engine/debrief";

export type MissionSave = MissionDesignConfig;
export type SpacecraftDesign = MissionDesignConfig;

export type PilotRank =
  | "Cadet"
  | "Flight Controller"
  | "Mission Planner"
  | "Flight Director"
  | "Program Director"
  | "Chief Engineer";

export interface ScenarioPersonalBest {
  bestScore: number;
  lowestCostM: number;
  highestScience: number;
  bestGrade: "S" | "A" | "B" | "C" | "D";
  completedCount: number;
}

export interface ProfileStats {
  missionsFlown: number;
  successCount: number;
  totalSciencePoints: number;
  totalDeltaVFluwnKmS: number;
  lessonsCompleted: number;
}

export interface ProfileRecord {
  id: string;
  callsign: string;
  avatarSeed: string;
  currentRank: PilotRank;
  xp: number;
  stats: ProfileStats;
  personalBests: Record<string, ScenarioPersonalBest>;
  favoriteOrbit: string | null;
  favoriteLauncher: string | null;
  streak: number;
  lastPlayedDate: string | null;
  unlockedAchievementIds: string[];
  demoModeUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MissionHistoryRecord {
  id: string;
  missionId: string;
  scenarioId: string;
  missionName: string;
  seed: string;
  completedAt: string;
  score: number;
  grade: "S" | "A" | "B" | "C" | "D";
  success: boolean;
  costM: number;
  massKg: number;
  deltaVKmS: number;
  orbitId: string;
  launcherId: string;
  patchSvg?: string;
  debriefSummary: string;
  debriefReport: DebriefReport;
  logEntries?: Array<{ tPlus: number; message: string; severity?: "info" | "warning" | "critical" }>;
  designSnapshot: SpacecraftDesign;
  updatedAt: string;
}

export interface ProfileRepository {
  getProfile(): Promise<ProfileRecord>;
  saveProfile(profile: ProfileRecord): Promise<void>;
  mergeProfile(remote: ProfileRecord): Promise<ProfileRecord>;
}

export interface MissionRepository {
  getMission(id: string): Promise<MissionSave | null>;
  saveMission(id: string, mission: MissionSave): Promise<void>;
  listMissions(): Promise<MissionSave[]>;
  deleteMission(id: string): Promise<void>;
}

export interface HistoryRepository {
  getHistory(): Promise<MissionHistoryRecord[]>;
  getRecord(id: string): Promise<MissionHistoryRecord | null>;
  addRecord(record: MissionHistoryRecord): Promise<void>;
  deleteRecord(id: string): Promise<void>;
  clearHistory(): Promise<void>;
  exportJson(): Promise<string>;
  importJson(json: string): Promise<{ imported: number; skipped: number }>;
}

export interface AppRepositories {
  profile: ProfileRepository;
  missions: MissionRepository;
  history: HistoryRepository;
}
