"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  align?: "left" | "right" | "center";
}

export const Popover: React.FC<PopoverProps> = ({
  trigger,
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
  align = "left",
}) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = React.useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : uncontrolledIsOpen;
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const toggle = () => {
    const next = !open;
    if (!isControlled) setUncontrolledIsOpen(next);
    onOpenChange?.(next);
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        if (!isControlled) setUncontrolledIsOpen(false);
        onOpenChange?.(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, isControlled, onOpenChange]);

  const alignStyles = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  return (
    <div ref={popoverRef} className="relative inline-block">
      <div onClick={toggle} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 min-w-[240px] max-w-sm rounded border border-space-border bg-space-panel-elevated p-3 shadow-xl animate-in fade-in duration-150",
            alignStyles[align],
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

