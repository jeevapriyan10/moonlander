"use client";

import React, { useState, useEffect } from "react";
import { useSettingsStore } from "@/store/settings";
import { Radio, Volume2, ChevronDown, ChevronUp, History } from "lucide-react";

export interface RadioTransmission {
  id: string;
  speaker: string; // e.g. "CAPCOM", "FLIGHT", "GUIDANCE", "RETRO"
  message: string;
  timestamp: string;
}

let subscribers: ((tx: RadioTransmission) => void)[] = [];

/**
 * Global dispatcher to broadcast a radio transmission to the Closed Captions log
 */
export function broadcastRadioTransmission(speaker: string, message: string): void {
  const tx: RadioTransmission = {
    id: `tx-${Math.random().toString(36).substring(2, 9)}`,
    speaker,
    message,
    timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
  subscribers.forEach((cb) => cb(tx));
}

export const RadioTransmissionLog: React.FC = () => {
  const { closedCaptionsEnabled } = useSettingsStore();
  const [transmissions, setTransmissions] = useState<RadioTransmission[]>([]);
  const [activeTransmission, setActiveTransmission] = useState<RadioTransmission | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handler = (tx: RadioTransmission) => {
      setActiveTransmission(tx);
      setTransmissions((prev) => [tx, ...prev.slice(0, 19)]); // Keep last 20

      // Active transmission badge stays visible for 6 seconds
      const timer = setTimeout(() => {
        setActiveTransmission((curr) => (curr?.id === tx.id ? null : curr));
      }, 6000);
      return () => clearTimeout(timer);
    };

    subscribers.push(handler);
    return () => {
      subscribers = subscribers.filter((cb) => cb !== handler);
    };
  }, []);

  if (!closedCaptionsEnabled) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-40 max-w-md w-full pointer-events-auto font-mono text-xs"
      aria-live="polite"
    >
      {/* Active Transmission Toast / Live Subtitle */}
      {activeTransmission && (
        <div className="mb-2 p-3 rounded-lg bg-black/90 border border-telemetry-amber/50 shadow-glow-amber backdrop-blur-md flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-6 h-6 rounded-full bg-telemetry-amber/20 border border-telemetry-amber flex items-center justify-center text-telemetry-amber shrink-0 mt-0.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold uppercase text-[11px] text-telemetry-amber tracking-wider">
                [{activeTransmission.speaker}]
              </span>
              <span className="text-[10px] text-gray-500">
                T+ {activeTransmission.timestamp}
              </span>
            </div>
            <p className="text-white text-xs leading-relaxed font-body">
              &quot;{activeTransmission.message}&quot;
            </p>
          </div>
        </div>
      )}

      {/* Collapsible Transcript Drawer Button */}
      {transmissions.length > 0 && (
        <div className="flex flex-col rounded-lg bg-space-panel/90 border border-space-border/80 backdrop-blur-md shadow-xl overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between px-3 py-1.5 text-[11px] text-gray-300 hover:text-white bg-black/40 border-b border-space-border/40 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-telemetry-cyan font-heading uppercase font-semibold">
              <History className="w-3.5 h-3.5" />
              <span>CAPCOM Comm Log ({transmissions.length})</span>
            </div>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {isExpanded && (
            <div className="max-h-48 overflow-y-auto p-2.5 flex flex-col gap-2 text-[11px]">
              {transmissions.map((tx) => (
                <div key={tx.id} className="flex flex-col gap-0.5 border-b border-space-border/30 pb-1.5 last:border-b-0">
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span className="text-telemetry-amber font-heading uppercase font-semibold">
                      {tx.speaker}
                    </span>
                    <span>{tx.timestamp}</span>
                  </div>
                  <span className="text-gray-200 font-body text-xs">
                    {tx.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
