import React from "react";
import { cn } from "@/lib/utils";

export interface StatReadoutProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  limit?: string | number;
  status?: "nominal" | "warning" | "alert" | "info" | "neutral";
  size?: "sm" | "md" | "lg";
  subtext?: string;
}

export const StatReadout: React.FC<StatReadoutProps> = ({
  className,
  label,
  value,
  unit,
  limit,
  status = "neutral",
  size = "md",
  subtext,
  ...props
}) => {
  const statusColors = {
    nominal: "text-telemetry-green",
    warning: "text-telemetry-orange",
    alert: "text-telemetry-red",
    info: "text-telemetry-cyan",
    neutral: "text-gray-100",
  };

  const dotColors = {
    nominal: "bg-telemetry-green shadow-[0_0_8px_rgba(74,222,128,0.6)]",
    warning: "bg-telemetry-orange shadow-[0_0_8px_rgba(255,138,61,0.6)]",
    alert: "bg-telemetry-red shadow-[0_0_8px_rgba(255,77,79,0.6)]",
    info: "bg-telemetry-cyan shadow-[0_0_8px_rgba(79,209,255,0.6)]",
    neutral: "bg-gray-500",
  };

  const valueSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <div
      className={cn(
        "flex flex-col p-2.5 rounded bg-black/20 border border-space-border/60 hover:border-space-border transition-colors",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between text-xs text-gray-400 font-heading uppercase tracking-wider mb-1">
        <span className="flex items-center gap-1.5 truncate">
          <span className={cn("w-1.5 h-1.5 rounded-full inline-block", dotColors[status])} />
          {label}
        </span>
        {limit !== undefined && (
          <span className="font-mono text-[10px] text-gray-500 truncate">
            MAX: {limit}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-end gap-1.5 font-mono text-right">
        <span className={cn("font-bold tracking-tight", valueSizes[size], statusColors[status])}>
          {value}
        </span>
        {unit && (
          <span className="text-xs text-gray-400 font-mono font-medium">
            {unit}
          </span>
        )}
      </div>

      {subtext && (
        <span className="text-[10px] font-mono text-gray-500 text-right mt-0.5 truncate">
          {subtext}
        </span>
      )}
    </div>
  );
};
