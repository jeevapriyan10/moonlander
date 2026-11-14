import React from "react";
import { cn } from "@/lib/utils";

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: "default" | "elevated" | "active" | "danger";
  headerClassName?: string;
  bodyClassName?: string;
}

export const Panel: React.FC<PanelProps> = ({
  className,
  title,
  subtitle,
  actions,
  variant = "default",
  headerClassName,
  bodyClassName,
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-space-panel border-space-border",
    elevated: "bg-space-panel-elevated border-space-border shadow-lg",
    active: "bg-space-panel border-telemetry-amber/50 shadow-glow-amber",
    danger: "bg-space-panel border-telemetry-red/50 shadow-glow-red",
  };

  return (
    <div
      className={cn(
        "relative rounded border flex flex-col backdrop-blur-sm overflow-hidden",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div
          className={cn(
            "flex items-center justify-between px-3.5 py-2.5 border-b border-space-border bg-black/20 select-none",
            headerClassName
          )}
        >
          <div className="flex flex-col">
            {title && (
              <h3 className="font-heading uppercase text-sm tracking-widest text-gray-200 flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && (
              <span className="text-[11px] font-mono text-gray-400 tracking-normal">
                {subtitle}
              </span>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-3.5 flex-1", bodyClassName)}>{children}</div>
    </div>
  );
};

