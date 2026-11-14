"use client";

import React from "react";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  const icons = {
    info: <Info className="w-4 h-4 text-telemetry-cyan shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-telemetry-green shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-telemetry-orange shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-telemetry-red shrink-0" />,
  };

  const borderColors = {
    info: "border-telemetry-cyan/40",
    success: "border-telemetry-green/40",
    warning: "border-telemetry-orange/40",
    error: "border-telemetry-red/40",
  };

  return (
    <div
      role="region"
      aria-label="Telemetry Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-start gap-2.5 p-3 rounded bg-space-panel-elevated/95 border shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200",
            borderColors[toast.type]
          )}
        >
          {icons[toast.type]}
          <div className="flex-1 text-xs">
            {toast.title && (
              <h4 className="font-heading uppercase text-gray-200 font-semibold mb-0.5 tracking-wider">
                {toast.title}
              </h4>
            )}
            <p className="text-gray-300 font-mono text-[11px] leading-relaxed">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss toast"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

