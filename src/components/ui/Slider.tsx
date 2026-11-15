"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  className?: string;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  className,
  disabled = false,
}) => {
  const [localText, setLocalText] = React.useState<string>(value.toString());

  React.useEffect(() => {
    setLocalText(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalText(e.target.value);
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(localText);
    if (isNaN(parsed) || parsed < min) {
      onChange(min);
      setLocalText(min.toString());
    } else if (parsed > max) {
      onChange(max);
      setLocalText(max.toString());
    } else {
      onChange(parsed);
      setLocalText(parsed.toString());
    }
  };

  return (
    <div className={cn("flex flex-col gap-2 p-2.5 rounded bg-black/20 border border-space-border/60", className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-heading uppercase text-gray-300 tracking-wider">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={localText}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            aria-label={`${label} numeric input`}
            className="w-16 px-1.5 py-0.5 text-right font-mono text-xs bg-space-bg border border-space-border rounded text-telemetry-amber focus:outline-none focus:border-telemetry-amber"
          />
          {unit && <span className="text-[11px] font-mono text-gray-400">{unit}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-500 w-8">{min}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          aria-label={label}
          className="flex-1 h-1.5 bg-space-border rounded-lg appearance-none cursor-pointer accent-telemetry-amber focus:outline-none focus:ring-1 focus:ring-telemetry-amber"
        />
        <span className="text-[10px] font-mono text-gray-500 w-8 text-right">{max}</span>
      </div>
    </div>
  );
};

