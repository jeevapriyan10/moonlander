import React from "react";
import { cn } from "@/lib/utils";

export interface GaugeProps {
  label: React.ReactNode;
  value: number;
  min?: number;
  max: number;
  unit?: string;
  variant?: "bar" | "arc";
  warningThreshold?: number; // e.g. 80%
  alertThreshold?: number; // e.g. 95%
  invertSeverity?: boolean; // e.g. for margin, lower is worse
  className?: string;
  showNumericReadout?: boolean;
}

export const Gauge: React.FC<GaugeProps> = ({
  label,
  value,
  min = 0,
  max,
  unit = "",
  variant = "bar",
  warningThreshold,
  alertThreshold,
  invertSeverity = false,
  className,
  showNumericReadout = true,
}) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100));

  let status: "nominal" | "warning" | "alert" = "nominal";

  if (!invertSeverity) {
    if (alertThreshold !== undefined && value >= alertThreshold) {
      status = "alert";
    } else if (warningThreshold !== undefined && value >= warningThreshold) {
      status = "warning";
    }
  } else {
    // Inverted: e.g. power margin, if value is lower than threshold it is alert
    if (alertThreshold !== undefined && value <= alertThreshold) {
      status = "alert";
    } else if (warningThreshold !== undefined && value <= warningThreshold) {
      status = "warning";
    }
  }

  const fillColors = {
    nominal: "bg-telemetry-green shadow-[0_0_8px_rgba(74,222,128,0.5)]",
    warning: "bg-telemetry-orange shadow-[0_0_8px_rgba(255,138,61,0.5)]",
    alert: "bg-telemetry-red shadow-[0_0_8px_rgba(255,77,79,0.5)]",
  };

  const textColors = {
    nominal: "text-telemetry-green",
    warning: "text-telemetry-orange",
    alert: "text-telemetry-red",
  };

  const strokeColors = {
    nominal: "#4ADE80",
    warning: "#FF8A3D",
    alert: "#FF4D4F",
  };

  if (variant === "arc") {
    // SVG Semi-circular arc gauge
    const radius = 38;
    const strokeWidth = 7;
    const center = 50;
    // Arc spans 180 degrees (-180 to 0)
    const circumference = Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className={cn("flex flex-col items-center p-2 rounded bg-black/20 border border-space-border/60", className)}>
        <span className="text-[11px] font-heading uppercase text-gray-400 tracking-wider mb-1">
          {label}
        </span>
        <div className="relative w-28 h-16 flex items-end justify-center overflow-hidden">
          <svg className="w-28 h-28 transform -rotate-180" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#1B2440"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
            {/* Colored Active Arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={strokeColors[status]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          </svg>
          <div className="absolute bottom-0 text-center flex flex-col items-center">
            <span className={cn("font-mono text-base font-bold", textColors[status])}>
              {value.toFixed(1)}
              <span className="text-[10px] text-gray-400 font-mono ml-0.5">{unit}</span>
            </span>
          </div>
        </div>
        <div className="flex justify-between w-full text-[9px] font-mono text-gray-500 mt-1 px-2">
          <span>{min}</span>
          <span>{percentage.toFixed(0)}%</span>
          <span>{max}</span>
        </div>
      </div>
    );
  }

  // Horizontal Bar Variant
  return (
    <div className={cn("flex flex-col gap-1 p-2 rounded bg-black/20 border border-space-border/60", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-heading uppercase text-gray-400 tracking-wider text-[11px] truncate">
          {label}
        </span>
        {showNumericReadout && (
          <span className={cn("font-mono font-bold text-right", textColors[status])}>
            {value.toFixed(1)} {unit}
            <span className="text-gray-500 font-normal text-[10px] ml-1">
              ({percentage.toFixed(0)}%)
            </span>
          </span>
        )}
      </div>

      <div className="relative h-2 w-full bg-space-border/50 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300 ease-out", fillColors[status])}
          style={{ width: `${percentage}%` }}
        />
        {/* Warning threshold indicator */}
        {warningThreshold !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/60 z-10"
            style={{ left: `${((warningThreshold - min) / (max - min)) * 100}%` }}
            title={`Warning: ${warningThreshold}`}
          />
        )}
      </div>
    </div>
  );
};
