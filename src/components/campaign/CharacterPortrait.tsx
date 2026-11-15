"use client";

import React from "react";
import type { CharacterId } from "@/data/campaign/types";
import { CHARACTERS } from "@/data/campaign/types";

interface CharacterPortraitProps {
  speaker: CharacterId;
  size?: number;
  className?: string;
}

export const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  speaker,
  size = 72,
  className = "",
}) => {
  const profile = CHARACTERS[speaker] || CHARACTERS.okafor;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-space-bg border overflow-hidden shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: profile.accentColor,
        boxShadow: `0 0 10px ${profile.accentColor}40`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={`bg-${speaker}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0B132B" />
          </linearGradient>
        </defs>

        {/* Backdrop */}
        <rect width="100" height="100" fill={`url(#bg-${speaker})`} />

        {/* Ambient Grid Lines */}
        <line x1="0" y1="25" x2="100" y2="25" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />

        {/* OKAFOR: Director */}
        {speaker === "okafor" && (
          <g>
            {/* Shoulders / Flight Jacket */}
            <path d="M 15 100 L 25 72 L 75 72 L 85 100 Z" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <path d="M 35 72 L 50 85 L 65 72" fill="#1E293B" />
            {/* Gold Commander Pin */}
            <polygon points="50,77 52,81 56,81 53,83 54,87 50,85 46,87 47,83 44,81 48,81" fill="#F59E0B" />
            {/* Neck */}
            <rect x="42" y="55" width="16" height="18" fill="#78350F" />
            {/* Head */}
            <ellipse cx="50" cy="42" rx="18" ry="22" fill="#78350F" stroke="#334155" strokeWidth="1" />
            {/* Hair */}
            <path d="M 30 38 C 30 18 70 18 70 38 C 70 28 30 28 30 38 Z" fill="#1E1E24" />
            {/* Eyes */}
            <circle cx="43" cy="41" r="2" fill="#FFFFFF" />
            <circle cx="57" cy="41" r="2" fill="#FFFFFF" />
            {/* Confident Brow */}
            <path d="M 39 36 Q 44 34 47 36" stroke="#1E1E24" strokeWidth="1.5" fill="none" />
            <path d="M 53 36 Q 56 34 61 36" stroke="#1E1E24" strokeWidth="1.5" fill="none" />
          </g>
        )}

        {/* ARAI: Chief Engineer */}
        {speaker === "arai" && (
          <g>
            {/* Shoulders / Engineering Vest */}
            <path d="M 15 100 L 26 70 L 74 70 L 85 100 Z" fill="#18181B" stroke="#F59E0B" strokeWidth="1.5" />
            {/* Lanyard */}
            <path d="M 35 70 L 45 95 L 55 95 L 65 70" stroke="#F59E0B" strokeWidth="1" fill="none" />
            {/* Neck */}
            <rect x="42" y="54" width="16" height="18" fill="#D4D4D8" />
            {/* Head */}
            <ellipse cx="50" cy="42" rx="17" ry="21" fill="#E4E4E7" stroke="#3F3F46" strokeWidth="1" />
            {/* Hair */}
            <path d="M 31 34 C 33 16 67 16 69 34 C 65 24 35 24 31 34 Z" fill="#18181B" />
            {/* Glasses */}
            <rect x="36" y="38" width="11" height="7" rx="1" fill="none" stroke="#F59E0B" strokeWidth="1.2" />
            <rect x="53" y="38" width="11" height="7" rx="1" fill="none" stroke="#F59E0B" strokeWidth="1.2" />
            <line x1="47" y1="41" x2="53" y2="41" stroke="#F59E0B" strokeWidth="1.2" />
            {/* Headset & Mic */}
            <path d="M 31 42 Q 30 25 50 24" stroke="#71717A" strokeWidth="1.5" fill="none" />
            <rect x="29" y="38" width="4" height="10" rx="1" fill="#F59E0B" />
            <path d="M 31 46 Q 38 52 44 50" stroke="#71717A" strokeWidth="1.2" fill="none" />
            <circle cx="44" cy="50" r="1.5" fill="#EF4444" />
          </g>
        )}

        {/* FERREIRA: Science Director */}
        {speaker === "ferreira" && (
          <g>
            {/* Lab Collar */}
            <path d="M 15 100 L 25 72 L 75 72 L 85 100 Z" fill="#2E1065" stroke="#A855F7" strokeWidth="1.5" />
            <path d="M 40 72 L 50 88 L 60 72" fill="#581C87" />
            {/* Spectroscopy Prism Lapel Pin */}
            <polygon points="34,78 38,84 30,84" fill="#C084FC" stroke="#FFFFFF" strokeWidth="0.5" />
            {/* Neck */}
            <rect x="43" y="55" width="14" height="18" fill="#FDE047" opacity="0.3" />
            {/* Head */}
            <ellipse cx="50" cy="42" rx="17" ry="21" fill="#FBCFE8" stroke="#701A75" strokeWidth="1" />
            {/* Hair */}
            <path d="M 29 45 C 28 20 72 20 71 45 C 75 52 68 60 65 48 C 60 25 40 25 35 48 Z" fill="#3B0764" />
            {/* Inquisitive Eyes */}
            <circle cx="44" cy="41" r="2" fill="#3B0764" />
            <circle cx="56" cy="41" r="2" fill="#3B0764" />
            <path d="M 40 37 Q 44 34 47 37" stroke="#3B0764" strokeWidth="1.2" fill="none" />
            <path d="M 53 37 Q 56 34 60 37" stroke="#3B0764" strokeWidth="1.2" fill="none" />
          </g>
        )}

        {/* HALE: Treasury Liaison */}
        {speaker === "hale" && (
          <g>
            {/* Formal Suit & Tie */}
            <path d="M 15 100 L 26 70 L 74 70 L 85 100 Z" fill="#064E3B" stroke="#10B981" strokeWidth="1.5" />
            <polygon points="45,70 55,70 52,95 48,95" fill="#022C22" stroke="#10B981" strokeWidth="0.8" />
            {/* Tie Clip */}
            <line x1="47" y1="80" x2="53" y2="80" stroke="#FDE047" strokeWidth="1" />
            {/* Neck */}
            <rect x="43" y="55" width="14" height="16" fill="#E2E8F0" />
            {/* Head */}
            <ellipse cx="50" cy="42" rx="16" ry="21" fill="#CBD5E1" stroke="#334155" strokeWidth="1" />
            {/* Hair - parted, stern */}
            <path d="M 33 32 C 34 20 66 20 67 32 C 60 22 40 22 33 32 Z" fill="#334155" />
            {/* Analytical Narrow Gaze */}
            <line x1="42" y1="41" x2="47" y2="41" stroke="#0F172A" strokeWidth="1.5" />
            <line x1="53" y1="41" x2="58" y2="41" stroke="#0F172A" strokeWidth="1.5" />
            <path d="M 40 37 Q 45 35 48 38" stroke="#0F172A" strokeWidth="1.2" fill="none" />
            <path d="M 52 38 Q 55 35 60 37" stroke="#0F172A" strokeWidth="1.2" fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
};
