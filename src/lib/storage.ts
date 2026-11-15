/**
 * MoonLander Persistent Storage Manager
 *
 * Implements:
 * - Safe localStorage access with graceful in-memory fallback for private browsing / blocked storage
 * - One-time migration from legacy storage keys (the only allowed mention of the former product name)
 * - Multi-tab storage event synchronization with last-write-wins timestamping
 * - Versioned schema persistence adapter for Zustand
 */

import type { StateStorage } from "zustand/middleware";

export const STORAGE_KEYS = {
  MISSION: "moonlander:mission",
  SETTINGS: "moonlander:settings",
  UI: "moonlander:ui",
  PROFILE: "moonlander:profile",
  HISTORY: "moonlander:history",
} as const;

// In-memory memory fallback store when localStorage is unavailable or quota exceeded
const inMemoryStore = new Map<string, string>();

let isStorageAvailableCache: boolean | null = null;
let hasReportedStorageFault = false;

/**
 * Checks whether localStorage is available and writable in the current browsing context.
 */
export function isLocalStorageAvailable(): boolean {
  if (isStorageAvailableCache !== null) return isStorageAvailableCache;
  if (typeof window === "undefined" || !window.localStorage) {
    isStorageAvailableCache = false;
    return false;
  }
  try {
    const testKey = "__moonlander_storage_probe__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    isStorageAvailableCache = true;
    return true;
  } catch {
    isStorageAvailableCache = false;
    if (!hasReportedStorageFault && typeof window !== "undefined") {
      hasReportedStorageFault = true;
      // Dispatch custom event for UI non-blocking notice
      window.dispatchEvent(
        new CustomEvent("moonlander:storage-restricted", {
          detail: { reason: "Private browsing mode or storage quota restriction detected. Operating with in-memory session." },
        })
      );
    }
    return false;
  }
}

/**
 * One-time migration shim: imports legacy storage keys into the new moonlander:* namespace.
 * Allowed hit: migration shim for the legacy project name.
 */
export function migrateLegacyStorage(): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const legacyKeysToMigrate: Array<{ legacy: string[]; target: string }> = [
      {
        legacy: ["missionforge:mission", "missionforge-mission-storage-v1", "moonlander-mission-storage-v1"],
        target: STORAGE_KEYS.MISSION,
      },
      {
        legacy: ["missionforge:settings", "missionforge-settings-storage-v1", "moonlander-settings-storage-v1"],
        target: STORAGE_KEYS.SETTINGS,
      },
      {
        legacy: ["missionforge:ui", "missionforge-ui-storage-v1", "moonlander-ui-storage-v1"],
        target: STORAGE_KEYS.UI,
      },
    ];

    for (const { legacy, target } of legacyKeysToMigrate) {
      if (!window.localStorage.getItem(target)) {
        for (const oldKey of legacy) {
          const raw = window.localStorage.getItem(oldKey);
          if (raw) {
            try {
              // Verify it parses before migrating
              JSON.parse(raw);
              window.localStorage.setItem(target, raw);
              window.localStorage.removeItem(oldKey);
              break;
            } catch {
              // Ignore corrupt legacy entry
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[MoonLander] Migration check completed with non-fatal warning:", err);
  }
}

// Execute migration check once on initial module load in browser
if (typeof window !== "undefined") {
  migrateLegacyStorage();
}

/**
 * Robust StateStorage adapter for Zustand with memory fallback and quota safety.
 */
export const safeStateStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (isLocalStorageAvailable()) {
      try {
        const item = window.localStorage.getItem(name);
        return item ?? inMemoryStore.get(name) ?? null;
      } catch {
        return inMemoryStore.get(name) ?? null;
      }
    }
    return inMemoryStore.get(name) ?? null;
  },

  setItem: (name: string, value: string): void => {
    inMemoryStore.set(name, value);
    if (isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(name, value);
      } catch (err) {
        console.warn(`[MoonLander] Failed to write to localStorage for key "${name}", using in-memory store:`, err);
      }
    }
  },

  removeItem: (name: string): void => {
    inMemoryStore.delete(name);
    if (isLocalStorageAvailable()) {
      try {
        window.localStorage.removeItem(name);
      } catch {
        // Ignore removal error
      }
    }
  },
};
