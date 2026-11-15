"use client";

import React from "react";
import Link from "next/link";

export interface WordmarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  asLink?: boolean;
  href?: string;
  className?: string;
}

/**
 * Original Minimal SVG Mark:
 * Crescent moon curve cradling a geometric Apollo/Surveyor-class lunar lander silhouette.
 */
export const MoonLanderLogoMark: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Geometric Crescent Moon Outer Horizon */}
    <path
      d="M27.5 5.5C21.2 5.5 16 10.3 15.3 16.5C14.8 21.2 17.5 25.4 21.6 27.5C19.8 28.5 17.7 29 15.5 29C8.6 29 3 23.4 3 16.5C3 9.6 8.6 4 15.5 4C19.9 4 23.8 6.3 26.1 9.8C26.7 8.3 27.5 6.9 28.5 5.7C28.2 5.6 27.8 5.5 27.5 5.5Z"
      fill="#4FD1FF"
      fillOpacity="0.4"
    />

    {/* Bright Crescent Moon Rim Arc */}
    <path
      d="M17.5 3C25.5 3 32 9.5 32 17.5C32 23.2 28.7 28.1 23.9 30.5C27.6 27.2 30 22.4 30 17C30 9.8 24.2 4 17 4C14.8 4 12.8 4.6 11 5.6C12.9 4 15.1 3 17.5 3Z"
      fill="#E2E8F0"
    />

    {/* Lunar Surface Ground Plane Line */}
    <path
      d="M8 29.5H28"
      stroke="#FFB000"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeDasharray="1 2.5"
    />

    {/* Lander Descent Body (Octagon silhouette) */}
    <path
      d="M15.5 21H20.5L22 24.5H14L15.5 21Z"
      fill="#FFB000"
    />

    {/* Lander Ascent Module (Cabin) */}
    <path
      d="M16 18H20L21 21H15L16 18Z"
      fill="#F8FAFC"
    />

    {/* Lander Descent Engine Bell */}
    <path
      d="M17.2 24.5H18.8L19.2 26.5H16.8L17.2 24.5Z"
      fill="#38BDF8"
    />

    {/* Left Strut & Footpad */}
    <line x1="14.5" y1="24" x2="11.5" y2="29" stroke="#E2E8F0" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="10" y1="29.5" x2="13" y2="29.5" stroke="#FFB000" strokeWidth="1.5" strokeLinecap="round" />

    {/* Right Strut & Footpad */}
    <line x1="21.5" y1="24" x2="24.5" y2="29" stroke="#E2E8F0" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="23" y1="29.5" x2="26" y2="29.5" stroke="#FFB000" strokeWidth="1.5" strokeLinecap="round" />

    {/* Top Antenna Beacon */}
    <line x1="18" y1="18" x2="18" y2="15.5" stroke="#FFB000" strokeWidth="1" strokeLinecap="round" />
    <circle cx="18" cy="15" r="0.8" fill="#FFB000" />
  </svg>
);

export const Wordmark: React.FC<WordmarkProps> = ({
  size = "md",
  showTagline = false,
  asLink = false,
  href = "/",
  className = "",
}) => {
  const sizeConfig = {
    sm: {
      markSize: 20,
      textSize: "text-sm",
      tracking: "tracking-[0.18em]",
      taglineSize: "text-[8px]",
    },
    md: {
      markSize: 26,
      textSize: "text-lg",
      tracking: "tracking-[0.22em]",
      taglineSize: "text-[9px]",
    },
    lg: {
      markSize: 34,
      textSize: "text-2xl",
      tracking: "tracking-[0.25em]",
      taglineSize: "text-[10px]",
    },
    xl: {
      markSize: 44,
      textSize: "text-4xl",
      tracking: "tracking-[0.28em]",
      taglineSize: "text-xs",
    },
  }[size];

  const content = (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        <MoonLanderLogoMark size={sizeConfig.markSize} />
        <span
          className={`font-heading uppercase font-bold text-white ${sizeConfig.textSize} ${sizeConfig.tracking} select-none flex items-baseline`}
        >
          <span>MOON</span>
          <span className="text-telemetry-amber">LANDER</span>
        </span>
      </div>
      {showTagline && (
        <span
          className={`font-mono text-gray-400 uppercase tracking-widest ${sizeConfig.taglineSize} mt-0.5 ml-0.5 select-none`}
        >
          Every mission begins with a decision.
        </span>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        href={href}
        className="group inline-flex items-center focus:outline-none focus-visible:ring-1 focus-visible:ring-telemetry-amber rounded"
      >
        {content}
      </Link>
    );
  }

  return content;
};
