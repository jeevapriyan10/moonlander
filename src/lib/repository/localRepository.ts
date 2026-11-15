/**
 * Local Storage & IndexedDB Repository Implementation for MoonLander
 * 
 * Provides concrete implementations of:
 * - LocalProfileRepository
 * - LocalMissionRepository
 * - LocalHistoryRepository
 * 
 * Employs deterministic last-write-wins and union merging for multi-device sync preparation.
 */

import type {
  ProfileRecord,
  MissionHistoryRecord,
  ProfileRepository,
  MissionRepository,
  HistoryRepository,
  AppRepositories,
  MissionSave,
} from "./types";
import { getRankForXp } from "@/engine/profile/ranks";
import { isLocalStorageAvailable, STORAGE_KEYS } from "@/lib/storage";

export const DEFAULT_PROFILE: ProfileRecord = {
  id: "guest-pilot",
  callsign: "Astro",
  avatarSeed: "pilot-01",
  currentRank: "Cadet",
  xp: 0,
  stats: {
    missionsFlown: 0,
    successCount: 0,
    totalSciencePoints: 0,
    totalDeltaVFluwnKmS: 0,
    lessonsCompleted: 0,
  },
  personalBests: {},
  favoriteOrbit: null,
  favoriteLauncher: null,
  streak: 1,
  lastPlayedDate: new Date().toISOString().split("T")[0] || null,
  unlockedAchievementIds: [],
  demoModeUnlocked: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// In-memory memory fallback stores
const memoryProfileStore: { current: ProfileRecord } = { current: { ...DEFAULT_PROFILE } };
const memoryMissionStore: Map<string, MissionSave> = new Map();
const memoryHistoryStore: Map<string, MissionHistoryRecord> = new Map();

/**
 * Local Profile Repository
 */
export class LocalProfileRepository implements ProfileRepository {
  async getProfile(): Promise<ProfileRecord> {
    if (!isLocalStorageAvailable()) {
      return { ...memoryProfileStore.current };
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!raw) {
        await this.saveProfile(DEFAULT_PROFILE);
        return { ...DEFAULT_PROFILE };
      }
      const parsed = JSON.parse(raw) as ProfileRecord;
      // Ensure rank matches XP deterministically
      const calculatedRank = getRankForXp(parsed.xp || 0).rank;
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        currentRank: calculatedRank,
        stats: { ...DEFAULT_PROFILE.stats, ...(parsed.stats || {}) },
        personalBests: parsed.personalBests || {},
        unlockedAchievementIds: parsed.unlockedAchievementIds || [],
      };
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  }

  async saveProfile(profile: ProfileRecord): Promise<void> {
    const updated: ProfileRecord = {
      ...profile,
      currentRank: getRankForXp(profile.xp).rank,
      updatedAt: profile.updatedAt || new Date().toISOString(),
    };

    memoryProfileStore.current = { ...updated };

    if (isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
      } catch (err) {
        console.warn("[LocalProfileRepository] Failed to write profile to localStorage:", err);
      }
    }
  }

  async mergeProfile(remote: ProfileRecord): Promise<ProfileRecord> {
    const local = await this.getProfile();
    const mergedXp = Math.max(local.xp, remote.xp);
    const calculatedRank = getRankForXp(mergedXp).rank;

    // Union of unlocked achievement IDs
    const achievementsSet = new Set([...local.unlockedAchievementIds, ...remote.unlockedAchievementIds]);

    // Merge personal bests: keep record with highest score per scenario
    const mergedBests = { ...local.personalBests };
    for (const [scenarioId, best] of Object.entries(remote.personalBests || {})) {
      const existing = mergedBests[scenarioId];
      if (!existing || best.bestScore > existing.bestScore) {
        mergedBests[scenarioId] = best;
      }
    }

    // Determine latest update timestamp for user preferences
    const remoteIsNewer = new Date(remote.updatedAt).getTime() > new Date(local.updatedAt).getTime();

    const merged: ProfileRecord = {
      id: local.id,
      callsign: remoteIsNewer ? remote.callsign : local.callsign,
      avatarSeed: remoteIsNewer ? remote.avatarSeed : local.avatarSeed,
      currentRank: calculatedRank,
      xp: mergedXp,
      stats: {
        missionsFlown: Math.max(local.stats.missionsFlown, remote.stats.missionsFlown),
        successCount: Math.max(local.stats.successCount, remote.stats.successCount),
        totalSciencePoints: Math.max(local.stats.totalSciencePoints, remote.stats.totalSciencePoints),
        totalDeltaVFluwnKmS: Math.max(local.stats.totalDeltaVFluwnKmS, remote.stats.totalDeltaVFluwnKmS),
        lessonsCompleted: Math.max(local.stats.lessonsCompleted, remote.stats.lessonsCompleted),
      },
      personalBests: mergedBests,
      favoriteOrbit: remoteIsNewer ? remote.favoriteOrbit : local.favoriteOrbit,
      favoriteLauncher: remoteIsNewer ? remote.favoriteLauncher : local.favoriteLauncher,
      streak: Math.max(local.streak, remote.streak),
      lastPlayedDate: remoteIsNewer ? remote.lastPlayedDate : local.lastPlayedDate,
      unlockedAchievementIds: Array.from(achievementsSet),
      demoModeUnlocked: local.demoModeUnlocked || remote.demoModeUnlocked,
      createdAt: local.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await this.saveProfile(merged);
    return merged;
  }
}

/**
 * Local Mission Repository
 */
export class LocalMissionRepository implements MissionRepository {
  private getStorageKey(): string {
    return STORAGE_KEYS.MISSION;
  }

  async getMission(id: string): Promise<MissionSave | null> {
    if (!isLocalStorageAvailable()) {
      return memoryMissionStore.get(id) || null;
    }
    try {
      const raw = window.localStorage.getItem(this.getStorageKey());
      if (!raw) return null;
      const store = JSON.parse(raw) as { state?: { savedMissions?: Record<string, MissionSave> } };
      return store.state?.savedMissions?.[id] || null;
    } catch {
      return null;
    }
  }

  async saveMission(id: string, mission: MissionSave): Promise<void> {
    memoryMissionStore.set(id, mission);
    if (!isLocalStorageAvailable()) return;
    try {
      const raw = window.localStorage.getItem(this.getStorageKey());
      const store = raw ? JSON.parse(raw) : { state: { savedMissions: {} } };
      if (!store.state) store.state = {};
      if (!store.state.savedMissions) store.state.savedMissions = {};
      store.state.savedMissions[id] = mission;
      window.localStorage.setItem(this.getStorageKey(), JSON.stringify(store));
    } catch (err) {
      console.warn("[LocalMissionRepository] Save failed:", err);
    }
  }

  async listMissions(): Promise<MissionSave[]> {
    if (!isLocalStorageAvailable()) {
      return Array.from(memoryMissionStore.values());
    }
    try {
      const raw = window.localStorage.getItem(this.getStorageKey());
      if (!raw) return [];
      const store = JSON.parse(raw) as { state?: { savedMissions?: Record<string, MissionSave> } };
      return Object.values(store.state?.savedMissions || {});
    } catch {
      return [];
    }
  }

  async deleteMission(id: string): Promise<void> {
    memoryMissionStore.delete(id);
    if (!isLocalStorageAvailable()) return;
    try {
      const raw = window.localStorage.getItem(this.getStorageKey());
      if (!raw) return;
      const store = JSON.parse(raw) as { state?: { savedMissions?: Record<string, MissionSave> } };
      if (store.state?.savedMissions) {
        delete store.state.savedMissions[id];
        window.localStorage.setItem(this.getStorageKey(), JSON.stringify(store));
      }
    } catch (err) {
      console.warn("[LocalMissionRepository] Delete failed:", err);
    }
  }
}

/**
 * Local History Repository
 */
export class LocalHistoryRepository implements HistoryRepository {
  async getHistory(): Promise<MissionHistoryRecord[]> {
    if (!isLocalStorageAvailable()) {
      return Array.from(memoryHistoryStore.values()).sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!raw) return [];
      const records = JSON.parse(raw) as MissionHistoryRecord[];
      return Array.isArray(records)
        ? records.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        : [];
    } catch {
      return [];
    }
  }

  async getRecord(id: string): Promise<MissionHistoryRecord | null> {
    const list = await this.getHistory();
    return list.find((r) => r.id === id) || null;
  }

  async addRecord(record: MissionHistoryRecord): Promise<void> {
    memoryHistoryStore.set(record.id, record);
    const existing = await this.getHistory();
    const updated = [record, ...existing.filter((r) => r.id !== record.id)];

    if (isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      } catch (err) {
        console.warn("[LocalHistoryRepository] Failed to save history record:", err);
      }
    }
  }

  async deleteRecord(id: string): Promise<void> {
    memoryHistoryStore.delete(id);
    const existing = await this.getHistory();
    const updated = existing.filter((r) => r.id !== id);

    if (isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      } catch (err) {
        console.warn("[LocalHistoryRepository] Failed to delete history record:", err);
      }
    }
  }

  async clearHistory(): Promise<void> {
    memoryHistoryStore.clear();
    if (isLocalStorageAvailable()) {
      try {
        window.localStorage.removeItem(STORAGE_KEYS.HISTORY);
      } catch (err) {
        console.warn("[LocalHistoryRepository] Failed to clear history:", err);
      }
    }
  }

  async exportJson(): Promise<string> {
    const history = await this.getHistory();
    return JSON.stringify(
      {
        format: "moonlander:history:v1",
        exportedAt: new Date().toISOString(),
        recordsCount: history.length,
        records: history,
      },
      null,
      2
    );
  }

  async importJson(json: string): Promise<{ imported: number; skipped: number }> {
    try {
      const parsed = JSON.parse(json) as {
        format?: string;
        records?: MissionHistoryRecord[];
      };

      if (!parsed || !Array.isArray(parsed.records)) {
        throw new Error("Invalid MoonLander history format");
      }

      const existing = await this.getHistory();
      const map = new Map<string, MissionHistoryRecord>();
      for (const item of existing) {
        map.set(item.id, item);
      }

      let imported = 0;
      let skipped = 0;

      for (const rec of parsed.records) {
        if (!rec.id || !rec.scenarioId || !rec.completedAt) {
          skipped++;
          continue;
        }
        const current = map.get(rec.id);
        if (!current || new Date(rec.updatedAt || rec.completedAt) > new Date(current.updatedAt || current.completedAt)) {
          map.set(rec.id, rec);
          imported++;
        } else {
          skipped++;
        }
      }

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );

      if (isLocalStorageAvailable()) {
        window.localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(merged));
      }

      return { imported, skipped };
    } catch (err) {
      throw new Error(`Failed to import history JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

/**
 * Singleton repository instance
 */
let repositoryInstance: AppRepositories | null = null;

export function getRepositories(): AppRepositories {
  if (!repositoryInstance) {
    repositoryInstance = {
      profile: new LocalProfileRepository(),
      missions: new LocalMissionRepository(),
      history: new LocalHistoryRepository(),
    };
  }
  return repositoryInstance;
}
