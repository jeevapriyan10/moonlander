"use client";

/**
 * PWA Service Worker Registration & Lifecycle Management
 * 
 * Implements a safe update flow ensuring users are notified of updates
 * and never stranded on stale builds.
 */

export interface PwaStatus {
  isSupported: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
}

let registrationInstance: ServiceWorkerRegistration | null = null;
let deferredInstallPrompt: any = null;

export function registerServiceWorker(onUpdateFound?: () => void): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  // Register in production or when service workers are supported
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      registrationInstance = reg;

      // Check for updates
      reg.addEventListener("updatefound", () => {
        const installingWorker = reg.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New content is available; notify user
            if (onUpdateFound) {
              onUpdateFound();
            }
          }
        });
      });
    } catch (err) {
      console.warn("[PWA] Service worker registration failed:", err);
    }
  });

  // Reload page when new worker takes control to avoid stale assets
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  // Listen for PWA installation prompt
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });
}

/**
 * Applies the pending service worker update immediately
 */
export function applyServiceWorkerUpdate(): void {
  if (registrationInstance && registrationInstance.waiting) {
    registrationInstance.waiting.postMessage({ type: "SKIP_WAITING" });
  }
}

/**
 * Triggers native PWA install prompt if available
 */
export async function promptPwaInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;

  try {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return outcome === "accepted";
  } catch {
    return false;
  }
}

export function isInstallPromptAvailable(): boolean {
  return deferredInstallPrompt !== null;
}
