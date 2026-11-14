import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "nominal" | "warning" | "alert" | "info" | "neutral" | "amber" | "outline";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  size = "md",
  children,
  ...props
}) => {
  const variantStyles = {
    nominal: "bg-telemetry-green/10 text-telemetry-green border-telemetry-green/30",
    warning: "bg-telemetry-orange/10 text-telemetry-orange border-telemetry-orange/30",
    alert: "bg-telemetry-red/10 text-telemetry-red border-telemetry-red/30",
    info: "bg-telemetry-cyan/10 text-telemetry-cyan border-telemetry-cyan/30",
    amber: "bg-telemetry-amber/10 text-telemetry-amber border-telemetry-amber/30",
    neutral: "bg-white/5 text-gray-300 border-space-border",
    outline: "bg-transparent text-gray-400 border-space-border hover:text-white",
  };

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5 tracking-wider font-mono uppercase font-semibold",
    md: "text-xs px-2 py-0.5 tracking-wider font-mono uppercase font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border font-mono transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

