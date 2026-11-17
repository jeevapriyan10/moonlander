/**
 * Supabase Cloud Storage Repository Implementation for MoonLander
 * 
 * Provides cloud-synchronized implementations of:
 * - SupabaseProfileRepository
 * - SupabaseMissionRepository
 * - SupabaseHistoryRepository
 * 
 * Supports:
 * - Offline write queue with auto-drain on network reconnect
 * - Conflict resolution: last-write-wins by updatedAt, union of achievements/history
 * - Fallback to LocalProfileRepository/LocalMissionRepository/LocalHistoryRepository when offline/unauthenticated
 * - First-time guest data import
 * - Full account deletion cascade
 */

import type {
  ProfileRecord,
  MissionHistoryRecord,
  ProfileRepository,
  MissionRepository,
  HistoryRepository,
  MissionSave,
} from "./types";
import {
  LocalProfileRepository,
  LocalMissionRepository,
  LocalHistoryRepository,
  DEFAULT_PROFILE,
} from "./localRepository";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isLocalStorageAvailable } from "@/lib/storage";

export const OFFLINE_QUEUE_KEY = "moonlander:offline_queue";

export type OfflineQueueAction =
  | { type: "SAVE_PROFILE"; payload: ProfileRecord; timestamp: number }
  | { type: "SAVE_MISSION"; id: string; payload: MissionSave; timestamp: number }
  | { type: "DELETE_MISSION"; id: string; timestamp: number }
  | { type: "ADD_HISTORY"; payload: MissionHistoryRecord; timestamp: number }
  | { type: "DELETE_HISTORY"; id: string; timestamp: number };

/**
 * Offline Write Queue Manager
 */
export class OfflineWriteQueue {
  private static isFlushing = false;

  static getQueue(): OfflineQueueAction[] {
    if (!isLocalStorageAvailable()) return [];
    try {
      const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static enqueue(action: OfflineQueueAction): void {
    if (!isLocalStorageAvailable()) return;
    try {
      const queue = this.getQueue();
      queue.push(action);
      window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.warn("[OfflineWriteQueue] Failed to enqueue action:", err);
    }
  }

  static clearQueue(): void {
    if (!isLocalStorageAvailable()) return;
    try {
      window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch {
      // ignore
    }
  }

  static getQueueLength(): number {
    return this.getQueue().length;
  }

  static async flush(supabase = getSupabaseBrowserClient()): Promise<number> {
    if (!supabase || this.isFlushing) return 0;
    const queue = this.getQueue();
    if (queue.length === 0) return 0;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    this.isFlushing = true;
    let flushedCount = 0;
    const remainingQueue: OfflineQueueAction[] = [];

    for (const item of queue) {
      try {
        if (item.type === "SAVE_PROFILE") {
          await supabase.from("profiles").upsert({
            id: user.id,
            callsign: item.payload.callsign,
            xp: item.payload.xp,
            rank_id: item.payload.currentRank.toLowerCase().replace(/\s+/g, "-"),
            unlocked_achievement_ids: item.payload.unlockedAchievementIds,
            personal_bests: item.payload.personalBests,
            updated_at: new Date(item.timestamp).toISOString(),
          });
        } else if (item.type === "SAVE_MISSION") {
          await supabase.from("missions").upsert({
            id: item.id,
            user_id: user.id,
            scenario_id: item.payload.scenarioId,
            difficulty: item.payload.difficulty,
            is_sandbox: item.payload.isSandbox ?? false,
            config: item.payload,
            updated_at: new Date(item.timestamp).toISOString(),
          });
        } else if (item.type === "DELETE_MISSION") {
          await supabase.from("missions").delete().eq("id", item.id).eq("user_id", user.id);
        } else if (item.type === "ADD_HISTORY") {
          await supabase.from("history").upsert({
            id: item.payload.id,
            user_id: user.id,
            mission_id: item.payload.missionId,
            scenario_id: item.payload.scenarioId,
            mission_name: item.payload.missionName,
            timestamp: item.payload.completedAt,
            success: item.payload.success,
            score: item.payload.score,
            metrics: {
              costM: item.payload.costM,
              massKg: item.payload.massKg,
              deltaVKmS: item.payload.deltaVKmS,
              orbitId: item.payload.orbitId,
              launcherId: item.payload.launcherId,
            },
            debrief: item.payload.debriefReport,
          });
        } else if (item.type === "DELETE_HISTORY") {
          await supabase.from("history").delete().eq("id", item.id).eq("user_id", user.id);
        }
        flushedCount++;
      } catch (err) {
        console.warn("[OfflineWriteQueue] Failed to execute queued item, retaining:", err);
        remainingQueue.push(item);
      }
    }

    if (isLocalStorageAvailable()) {
      window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    }
    this.isFlushing = false;
    return flushedCount;
  }
}

/**
 * Supabase Profile Repository
 */
export class SupabaseProfileRepository implements ProfileRepository {
  private localRepo = new LocalProfileRepository();

  async getProfile(): Promise<ProfileRecord> {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return this.localRepo.getProfile();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return this.localRepo.getProfile();

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        return this.localRepo.getProfile();
      }

      const local = await this.localRepo.getProfile();

      const profile: ProfileRecord = {
        ...local,
        id: data.id,
        callsign: data.callsign || local.callsign,
        xp: typeof data.xp === "number" ? data.xp : local.xp,
        personalBests: (data.personal_bests as Record<string, any>) || local.personalBests,
        unlockedAchievementIds: Array.isArray(data.unlocked_achievement_ids)
          ? data.unlocked_achievement_ids
          : local.unlockedAchievementIds,
        updatedAt: data.updated_at || local.updatedAt,
      };

      // Keep local in sync
      await this.localRepo.saveProfile(profile);
      return profile;
    } catch {
      return this.localRepo.getProfile();
    }
  }

  async saveProfile(profile: ProfileRecord): Promise<void> {
    await this.localRepo.saveProfile(profile);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        callsign: profile.callsign,
        xp: profile.xp,
        rank_id: profile.currentRank.toLowerCase().replace(/\s+/g, "-"),
        unlocked_achievement_ids: profile.unlockedAchievementIds,
        personal_bests: profile.personalBests,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        OfflineWriteQueue.enqueue({
          type: "SAVE_PROFILE",
          payload: profile,
          timestamp: Date.now(),
        });
      }
    } catch {
      OfflineWriteQueue.enqueue({
        type: "SAVE_PROFILE",
        payload: profile,
        timestamp: Date.now(),
      });
    }
  }

  async mergeProfile(remote: ProfileRecord): Promise<ProfileRecord> {
    const merged = await this.localRepo.mergeProfile(remote);
    await this.saveProfile(merged);
    return merged;
  }
}

/**
 * Supabase Mission Repository
 */
export class SupabaseMissionRepository implements MissionRepository {
  private localRepo = new LocalMissionRepository();

  async getMission(id: string): Promise<MissionSave | null> {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return this.localRepo.getMission(id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return this.localRepo.getMission(id);

      const { data, error } = await supabase
        .from("missions")
        .select("config")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        return this.localRepo.getMission(id);
      }

      return data.config as MissionSave;
    } catch {
      return this.localRepo.getMission(id);
    }
  }

  async saveMission(id: string, mission: MissionSave): Promise<void> {
    await this.localRepo.saveMission(id, mission);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("missions").upsert({
        id,
        user_id: user.id,
        scenario_id: mission.scenarioId,
        difficulty: mission.difficulty,
        is_sandbox: mission.isSandbox ?? false,
        config: mission,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        OfflineWriteQueue.enqueue({
          type: "SAVE_MISSION",
          id,
          payload: mission,
          timestamp: Date.now(),
        });
      }
    } catch {
      OfflineWriteQueue.enqueue({
        type: "SAVE_MISSION",
        id,
        payload: mission,
        timestamp: Date.now(),
      });
    }
  }

  async listMissions(): Promise<MissionSave[]> {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return this.localRepo.listMissions();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return this.localRepo.listMissions();

      const { data, error } = await supabase
        .from("missions")
        .select("config")
        .eq("user_id", user.id);

      if (error || !data || data.length === 0) {
        return this.localRepo.listMissions();
      }

      return data.map((d) => d.config as MissionSave);
    } catch {
      return this.localRepo.listMissions();
    }
  }

  async deleteMission(id: string): Promise<void> {
    await this.localRepo.deleteMission(id);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("missions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        OfflineWriteQueue.enqueue({
          type: "DELETE_MISSION",
          id,
          timestamp: Date.now(),
        });
      }
    } catch {
      OfflineWriteQueue.enqueue({
        type: "DELETE_MISSION",
        id,
        timestamp: Date.now(),
      });
    }
  }
}

/**
 * Supabase History Repository
 */
export class SupabaseHistoryRepository implements HistoryRepository {
  private localRepo = new LocalHistoryRepository();

  async getHistory(): Promise<MissionHistoryRecord[]> {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return this.localRepo.getHistory();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return this.localRepo.getHistory();

      const { data, error } = await supabase
        .from("history")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false });

      if (error || !data || data.length === 0) {
        return this.localRepo.getHistory();
      }

      return data.map((d) => ({
        id: d.id,
        missionId: d.mission_id,
        scenarioId: d.scenario_id,
        missionName: d.mission_name,
        seed: "ML-CLOUD",
        completedAt: d.timestamp,
        score: d.score,
        grade: "A" as const,
        success: d.success,
        costM: d.metrics?.costM || 0,
        massKg: d.metrics?.massKg || 0,
        deltaVKmS: d.metrics?.deltaVKmS || 0,
        orbitId: d.metrics?.orbitId || "leo-400",
        launcherId: d.metrics?.launcherId || "falcon-9",
        debriefSummary: d.debrief?.summary || "Nominal flight completion.",
        debriefReport: d.debrief,
        designSnapshot: {} as any,
        updatedAt: d.created_at,
      }));
    } catch {
      return this.localRepo.getHistory();
    }
  }

  async getRecord(id: string): Promise<MissionHistoryRecord | null> {
    const all = await this.getHistory();
    return all.find((r) => r.id === id) || null;
  }

  async addRecord(record: MissionHistoryRecord): Promise<void> {
    await this.localRepo.addRecord(record);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("history").upsert({
        id: record.id,
        user_id: user.id,
        mission_id: record.missionId,
        scenario_id: record.scenarioId,
        mission_name: record.missionName,
        timestamp: record.completedAt,
        success: record.success,
        score: record.score,
        metrics: {
          costM: record.costM,
          massKg: record.massKg,
          deltaVKmS: record.deltaVKmS,
          orbitId: record.orbitId,
          launcherId: record.launcherId,
        },
        debrief: record.debriefReport,
      });

      if (error) {
        OfflineWriteQueue.enqueue({
          type: "ADD_HISTORY",
          payload: record,
          timestamp: Date.now(),
        });
      }
    } catch {
      OfflineWriteQueue.enqueue({
        type: "ADD_HISTORY",
        payload: record,
        timestamp: Date.now(),
      });
    }
  }

  async deleteRecord(id: string): Promise<void> {
    await this.localRepo.deleteRecord(id);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("history")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        OfflineWriteQueue.enqueue({
          type: "DELETE_HISTORY",
          id,
          timestamp: Date.now(),
        });
      }
    } catch {
      OfflineWriteQueue.enqueue({
        type: "DELETE_HISTORY",
        id,
        timestamp: Date.now(),
      });
    }
  }

  async clearHistory(): Promise<void> {
    await this.localRepo.clearHistory();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("history").delete().eq("user_id", user.id);
    } catch (err) {
      console.warn("[SupabaseHistoryRepository] clearHistory error:", err);
    }
  }

  async exportJson(): Promise<string> {
    return this.localRepo.exportJson();
  }

  async importJson(json: string): Promise<{ imported: number; skipped: number }> {
    return this.localRepo.importJson(json);
  }
}

/**
 * Import local guest records into cloud profile upon first login.
 */
export async function importGuestDataToCloud(): Promise<{
  importedMissions: number;
  importedHistory: number;
  mergedProfile: ProfileRecord;
}> {
  const localProfileRepo = new LocalProfileRepository();
  const localMissionRepo = new LocalMissionRepository();
  const localHistoryRepo = new LocalHistoryRepository();

  const cloudProfileRepo = new SupabaseProfileRepository();
  const cloudMissionRepo = new SupabaseMissionRepository();
  const cloudHistoryRepo = new SupabaseHistoryRepository();

  const [localProfile, localMissions, localHistory] = await Promise.all([
    localProfileRepo.getProfile(),
    localMissionRepo.listMissions(),
    localHistoryRepo.getHistory(),
  ]);

  // Merge profile
  const mergedProfile = await cloudProfileRepo.mergeProfile(localProfile);

  // Upload local missions
  let importedMissions = 0;
  for (const m of localMissions) {
    await cloudMissionRepo.saveMission(m.id, m);
    importedMissions++;
  }

  // Upload local flight history
  let importedHistory = 0;
  for (const h of localHistory) {
    await cloudHistoryRepo.addRecord(h);
    importedHistory++;
  }

  return {
    importedMissions,
    importedHistory,
    mergedProfile,
  };
}

/**
 * Delete account data cascade (profiles, missions, history, leaderboard entries).
 */
export async function deleteUserAccountData(): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Delete child records
    await supabase.from("missions").delete().eq("user_id", user.id);
    await supabase.from("history").delete().eq("user_id", user.id);
    await supabase.from("leaderboard_entries").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);

    // Sign out
    await supabase.auth.signOut();

    // Reset local data to default
    const localProfileRepo = new LocalProfileRepository();
    await localProfileRepo.saveProfile({ ...DEFAULT_PROFILE });
    OfflineWriteQueue.clearQueue();

    return true;
  } catch (err) {
    console.error("[deleteUserAccountData] Error deleting user account data:", err);
    return false;
  }
}
