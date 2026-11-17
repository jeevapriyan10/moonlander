"use client";

import React, { useEffect, useState } from "react";
import {
  registerServiceWorker,
  applyServiceWorkerUpdate,
  promptPwaInstall,
  isInstallPromptAvailable,
} from "@/lib/pwa/serviceWorker";
import { RefreshCw, Download, WifiOff } from "lucide-react";

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Register SW
    registerServiceWorker(() => {
      setHasUpdate(true);
    });

    const checkInstallInterval = setInterval(() => {
      setCanInstall(isInstallPromptAvailable());
    }, 2000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(checkInstallInterval);
    };
  }, []);

  const handleUpdate = () => {
    applyServiceWorkerUpdate();
  };

  const handleInstall = async () => {
    const installed = await promptPwaInstall();
    if (installed) {
      setCanInstall(false);
    }
  };

  return (
    <>
      {/* Offline Status Indicator */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-telemetry-orange/90 backdrop-blur border-b border-telemetry-orange text-space-bg px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-mono font-bold shadow-md">
          <WifiOff className="w-3.5 h-3.5" />
          <span>OFFLINE TELEMETRY ACTIVE — Academy & Local Missions Available</span>
        </div>
      )}

      {/* New Build Available Banner */}
      {hasUpdate && (
        <div className="fixed bottom-4 right-4 z-50 bg-space-panel/95 backdrop-blur border border-telemetry-cyan p-4 rounded-xl shadow-2xl flex flex-col gap-2 max-w-sm font-mono text-xs text-slate-200">
          <div className="flex items-center gap-2 text-telemetry-cyan font-bold">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>MISSION BUILD UPDATE AVAILABLE</span>
          </div>
          <p className="text-gray-400 text-[11px]">
            A new version of MoonLander with updated physics and flight telemetry is ready.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-telemetry-cyan text-space-bg font-bold py-1.5 px-3 rounded hover:bg-cyan-400 transition-colors uppercase"
            >
              Update Now
            </button>
            <button
              onClick={() => setHasUpdate(false)}
              className="px-3 py-1.5 border border-space-border text-gray-400 rounded hover:text-white hover:border-gray-500 uppercase"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Install App Prompt */}
      {canInstall && !hasUpdate && (
        <div className="hidden md:flex fixed bottom-4 right-4 z-40 bg-space-panel/90 backdrop-blur border border-telemetry-amber/50 px-3 py-2 rounded-lg shadow-lg items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-telemetry-amber font-bold">
            <Download className="w-4 h-4" />
            <span>INSTALL DESKTOP / MOBILE APP</span>
          </div>
          <button
            onClick={handleInstall}
            className="bg-telemetry-amber/20 border border-telemetry-amber/50 text-telemetry-amber px-2.5 py-1 rounded hover:bg-telemetry-amber/30 text-[11px] font-bold uppercase transition-colors"
          >
            Install
          </button>
          <button
            onClick={() => setCanInstall(false)}
            className="text-gray-500 hover:text-gray-300 text-[11px]"
          >
            ✕
          </button>
        </div>
      )}

      {children}
    </>
  );
};
