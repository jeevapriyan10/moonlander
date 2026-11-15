"use client";

import { useEffect, useState } from "react";
import { useMissionStore } from "@/store/mission";
import { useSettingsStore } from "@/store/settings";
import { useUIStore } from "@/store/ui";
import { STORAGE_KEYS } from "./storage";

/**
 * Ensures clean client-side hydration for persisted stores with zero SSR mismatch.
 * Also configures multi-tab cross-sync via storage events.
 */
export function useHasHydrated(): boolean {
  const [hasHydrated, setHasHydrated] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    // 1. Manually rehydrate stores on client mount
    try {
      useMissionStore.persist.rehydrate();
      useSettingsStore.persist.rehydrate();
    } catch (err) {
      console.warn("[MoonLander] Store rehydration warning:", err);
    }
    setHasHydrated(true);

    // 2. Multi-tab synchronization handler
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.MISSION) {
        useMissionStore.persist.rehydrate();
      } else if (e.key === STORAGE_KEYS.SETTINGS) {
        useSettingsStore.persist.rehydrate();
      }
    };

    // 3. Storage restriction alert handler
    const handleStorageRestricted = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason: string }>;
      addToast({
        type: "warning",
        title: "STORAGE RESTRICTED",
        message: customEvent.detail?.reason || "Operating in private browsing mode: missions saved in memory for this session.",
      });
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("moonlander:storage-restricted", handleStorageRestricted);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("moonlander:storage-restricted", handleStorageRestricted);
    };
  }, [addToast]);

  return hasHydrated;
}
