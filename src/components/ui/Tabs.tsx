import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  size = "md",
}) => {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;
    if (e.key === "ArrowRight") {
      newIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      newIndex = 0;
    } else if (e.key === "End") {
      newIndex = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const targetTab = tabs[newIndex];
    if (targetTab && !targetTab.disabled) {
      onChange(targetTab.id);
    }
  };

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-2 text-sm",
  };

  return (
    <div
      role="tablist"
      aria-label="Subsystem Tabs"
      className={cn(
        "flex items-center gap-1 border-b border-space-border bg-black/30 overflow-x-auto no-scrollbar",
        className
      )}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "font-heading uppercase tracking-wider transition-all duration-150 relative flex items-center gap-2 select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-telemetry-amber focus-visible:ring-offset-1 focus-visible:ring-offset-space-bg",
              sizeStyles[size],
              isActive
                ? "text-telemetry-amber font-bold border-b-2 border-telemetry-amber bg-telemetry-amber/5"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border-b-2 border-transparent",
              tab.disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {tab.icon && <span className="opacity-80">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                  isActive
                    ? "bg-telemetry-amber/20 text-telemetry-amber"
                    : "bg-white/10 text-gray-400"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
