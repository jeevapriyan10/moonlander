import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-heading uppercase tracking-wider transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-telemetry-amber focus-visible:ring-offset-2 focus-visible:ring-offset-space-bg disabled:opacity-50 disabled:pointer-events-none select-none rounded";

    const variantStyles = {
      primary:
        "bg-telemetry-amber text-space-bg font-bold hover:bg-telemetry-amber/90 active:scale-[0.98] shadow-glow-amber border border-telemetry-amber/60",
      secondary:
        "bg-space-panel text-telemetry-cyan border border-telemetry-cyan/40 hover:bg-telemetry-cyan/10 active:scale-[0.98]",
      outline:
        "bg-transparent text-gray-200 border border-space-border hover:border-space-border-active hover:bg-white/5 active:scale-[0.98]",
      ghost:
        "bg-transparent text-gray-300 hover:text-white hover:bg-white/5 active:scale-[0.98]",
      danger:
        "bg-telemetry-red/20 text-telemetry-red border border-telemetry-red/50 hover:bg-telemetry-red/30 active:scale-[0.98]",
    };

    const sizeStyles = {
      sm: "text-xs h-7 px-2.5 gap-1.5",
      md: "text-sm h-9 px-4 gap-2",
      lg: "text-base h-11 px-6 gap-2.5 font-semibold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
