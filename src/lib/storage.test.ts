import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  STORAGE_KEYS,
  isLocalStorageAvailable,
  safeStateStorage,
  migrateLegacyStorage,
} from "./storage";

describe("Storage Manager & Migration Shim", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("identifies standard storage keys correctly", () => {
    expect(STORAGE_KEYS.MISSION).toBe("moonlander:mission");
    expect(STORAGE_KEYS.SETTINGS).toBe("moonlander:settings");
    expect(STORAGE_KEYS.UI).toBe("moonlander:ui");
  });

  it("correctly writes and reads via safeStateStorage", () => {
    safeStateStorage.setItem("test:key", JSON.stringify({ nominal: true }));
    const result = safeStateStorage.getItem("test:key");
    expect(result).not.toBeNull();
    expect(JSON.parse(result as string)).toEqual({ nominal: true });
    safeStateStorage.removeItem("test:key");
    expect(safeStateStorage.getItem("test:key")).toBeNull();
  });

  it("migrates legacy storage keys to moonlander namespace cleanly", () => {
    // Populate mock legacy key
    const mockMission = { state: { currentMission: { name: "Apollo Legacy" } }, version: 1 };
    localStorage.setItem("moonlander-mission-storage-v1", JSON.stringify(mockMission));

    // Run migration
    migrateLegacyStorage();

    // Verify migrated to target key
    const migrated = localStorage.getItem(STORAGE_KEYS.MISSION);
    expect(migrated).not.toBeNull();
    expect(JSON.parse(migrated!)).toEqual(mockMission);
  });
});
