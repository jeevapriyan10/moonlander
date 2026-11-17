"use client";

import React from "react";
import type { CrewRole } from "@/engine/crew/types";
import { Compass, Cpu, Orbit, Radio } from "lucide-react";

interface RoleBadgeProps {
  role: CrewRole;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const ROLE_META: Record<
  CrewRole,
  {
    label: string;
    shortLabel: string;
    colorClasses: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  MISSION_DIRECTOR: {
    label: "Mission Director / PI",
    shortLabel: "DIR / PI",
    colorClasses: "bg-telemetry-amber/10 border-telemetry-amber/50 text-telemetry-amber",
    icon: Compass,
  },
  SPACECRAFT_ENGINEER: {
    label: "Spacecraft Engineer",
    shortLabel: "SYS ENG",
    colorClasses: "bg-telemetry-cyan/10 border-telemetry-cyan/50 text-telemetry-cyan",
    icon: Cpu,
  },
  FLIGHT_DYNAMICS: {
    label: "Flight Dynamics & Launch",
    shortLabel: "FLIGHT DYN",
    colorClasses: "bg-telemetry-green/10 border-telemetry-green/50 text-telemetry-green",
    icon: Orbit,
  },
  COMMS_FINANCE: {
    label: "Comms & Finance",
    shortLabel: "COMMS & FIN",
    colorClasses: "bg-purple-500/10 border-purple-500/50 text-purple-400",
    icon: Radio,
  },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = "md",
  showIcon = true,
  className = "",
}) => {
  const meta = ROLE_META[role];
  const Icon = meta.icon;

  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-1.5 py-0.5 gap-1"
      : size === "lg"
      ? "text-xs px-3 py-1 gap-2"
      : "text-[11px] px-2 py-0.5 gap-1.5";

  const iconSizes =
    size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <span
      className={`inline-flex items-center font-mono uppercase tracking-wider rounded border font-semibold ${meta.colorClasses} ${sizeClasses} ${className}`}
    >
      {showIcon && <Icon className={iconSizes} />}
      <span>{size === "sm" ? meta.shortLabel : meta.label}</span>
    </span>
  );
};
