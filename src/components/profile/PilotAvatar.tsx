"use client";

import React from "react";
import type { PilotRank } from "@/lib/repository/types";

interface PilotAvatarProps {
  seed: string;
  rank: PilotRank;
  size?: number;
  className?: string;
}

const RANK_ACCENTS: Record<PilotRank, { primary: string; secondary: string; glow: string }> = {
  Cadet: { primary: "#38bdf8", secondary: "#0284c7", glow: "rgba(56, 189, 248, 0.4)" },
  "Flight Controller": { primary: "#2dd4bf", secondary: "#0d9488", glow: "rgba(45, 212, 191, 0.4)" },
  "Mission Planner": { primary: "#f59e0b", secondary: "#b45309", glow: "rgba(245, 158, 11, 0.4)" },
  "Flight Director": { primary: "#f97316", secondary: "#c2410c", glow: "rgba(249, 115, 22, 0.4)" },
  "Program Director": { primary: "#a855f7", secondary: "#7e22ce", glow: "rgba(168, 85, 247, 0.4)" },
  "Chief Engineer": { primary: "#eab308", secondary: "#ca8a04", glow: "rgba(234, 179, 8, 0.6)" },
};

export const PilotAvatar: React.FC<PilotAvatarProps> = ({
  seed,
  rank,
  size = 64,
  className = "",
}) => {
  const accent = RANK_ACCENTS[rank] || RANK_ACCENTS.Cadet;

  // Simple deterministic hash of seed string for variation
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const visorHue = Math.abs(hash % 360);
  const visorStyle = Math.abs((hash >> 2) % 3); // 0: wide bubble, 1: angular, 2: split

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-space-bg border overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: accent.primary,
        boxShadow: `0 0 12px ${accent.glow}`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={`helmet-grad-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0B132B" />
          </linearGradient>
          <linearGradient id={`visor-grad-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={`hsl(${visorHue}, 80%, 65%)`} />
            <stop offset="100%" stopColor={`hsl(${visorHue}, 90%, 30%)`} />
          </linearGradient>
        </defs>

        {/* Outer space background pattern */}
        <rect width="100" height="100" fill="#05070E" />
        <circle cx="20" cy="25" r="1" fill="#FFFFFF" opacity="0.4" />
        <circle cx="85" cy="18" r="1" fill="#FFFFFF" opacity="0.5" />
        <circle cx="75" cy="80" r="1.5" fill="#FFFFFF" opacity="0.3" />

        {/* Space Suit Neck Ring */}
        <ellipse cx="50" cy="85" rx="36" ry="12" fill="#334155" stroke={accent.primary} strokeWidth="1.5" />

        {/* Helmet Base */}
        <circle cx="50" cy="48" r="32" fill={`url(#helmet-grad-${seed})`} stroke="#475569" strokeWidth="2" />

        {/* Helmet Accent Stripes */}
        <path d="M 28 35 Q 50 20 72 35" stroke={accent.primary} strokeWidth="2.5" fill="none" />
        <path d="M 32 40 Q 50 28 68 40" stroke={accent.secondary} strokeWidth="1" fill="none" opacity="0.6" />

        {/* Visor Styles */}
        {visorStyle === 0 && (
          // Wide Bubble Visor
          <path
            d="M 30 45 C 30 35 70 35 70 45 C 70 62 30 62 30 45 Z"
            fill={`url(#visor-grad-${seed})`}
            stroke="#94A3B8"
            strokeWidth="1.5"
          />
        )}
        {visorStyle === 1 && (
          // Angular Aviator Visor
          <polygon
            points="32,40 68,40 64,60 36,60"
            fill={`url(#visor-grad-${seed})`}
            stroke="#94A3B8"
            strokeWidth="1.5"
          />
        )}
        {visorStyle === 2 && (
          // Dual Split Visor
          <g>
            <rect
              x="28"
              y="42"
              width="44"
              height="18"
              rx="4"
              fill={`url(#visor-grad-${seed})`}
              stroke="#94A3B8"
              strokeWidth="1.5"
            />
            <line x1="50" y1="42" x2="50" y2="60" stroke="#0B132B" strokeWidth="2" />
          </g>
        )}

        {/* Visor Glare / Specular Highlight */}
        <path
          d="M 35 42 Q 50 36 62 42"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Comm Microphones / Side nodes */}
        <circle cx="20" cy="52" r="3.5" fill={accent.primary} stroke="#0B132B" strokeWidth="1" />
        <circle cx="80" cy="52" r="3.5" fill={accent.primary} stroke="#0B132B" strokeWidth="1" />

        {/* Rank Star Insignia on Chest */}
        {rank === "Chief Engineer" && (
          <polygon points="50,78 52,83 57,83 53,86 55,91 50,88 45,91 47,86 43,83 48,83" fill="#EAB308" />
        )}
      </svg>
    </div>
  );
};
