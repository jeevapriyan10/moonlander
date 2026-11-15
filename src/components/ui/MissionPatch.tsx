"use client";

import React, { useId } from "react";
import { Download } from "lucide-react";
import { Button } from "./Button";

export interface MissionPatchProps {
  missionName: string;
  scenarioId: string;
  seed: string;
  grade?: "S" | "A" | "B" | "C" | "D";
  size?: number; // size in pixels, default 240
  showDownload?: boolean;
}

export const MissionPatch: React.FC<MissionPatchProps> = ({
  missionName,
  scenarioId,
  seed,
  grade = "A",
  size = 240,
  showDownload = true,
}) => {
  const uniqueId = useId().replace(/:/g, "");
  const patchElementId = `mission-patch-${uniqueId}`;

  // Palette based on mission grade
  const gradeBorderColor =
    grade === "S" ? "#F59E0B" : grade === "A" ? "#10B981" : grade === "B" ? "#06B6D4" : "#F97316";

  const handleDownloadSvg = () => {
    const svgEl = document.getElementById(patchElementId);
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${missionName.toLowerCase().replace(/\s+/g, "-")}-patch.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        id={patchElementId}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 300 300"
        width={size}
        height={size}
        className="drop-shadow-2xl select-none"
      >
        <defs>
          {/* Circular Text Paths */}
          <path
            id={`topArc-${uniqueId}`}
            d="M 45,150 A 105,105 0 0,1 255,150"
            fill="none"
          />
          <path
            id={`bottomArc-${uniqueId}`}
            d="M 255,150 A 105,105 0 0,1 45,150"
            fill="none"
          />

          {/* Deep Space Background Gradient */}
          <radialGradient id={`bgGrad-${uniqueId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="70%" stopColor="#050814" />
            <stop offset="100%" stopColor="#020308" />
          </radialGradient>

          {/* Embroidered Thread Filter */}
          <filter id={`embroidery-${uniqueId}`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* 1. Outer Embroidered Border Ring */}
        <circle cx="150" cy="150" r="146" fill="#0A0E1A" stroke="#1E293B" strokeWidth="4" />
        <circle cx="150" cy="150" r="140" fill="none" stroke={gradeBorderColor} strokeWidth="3" strokeDasharray="4 2" />

        {/* 2. Outer Navy Title Ring */}
        <circle cx="150" cy="150" r="136" fill="#0A1128" stroke="#1E293B" strokeWidth="1.5" />

        {/* Perimeter Stars */}
        {[30, 60, 90, 120, 210, 240, 270, 300].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const sx = 150 + Math.cos(rad) * 122;
          const sy = 150 + Math.sin(rad) * 122;
          return <circle key={deg} cx={sx} cy={sy} r="1.5" fill="#FDE047" opacity="0.9" />;
        })}

        {/* Outer Circular Arc Text */}
        <text fill="#F8FAFC" fontSize="11" fontFamily="'Barlow Condensed', sans-serif" fontWeight="700" letterSpacing="2.5">
          <textPath href={`#topArc-${uniqueId}`} startOffset="50%" textAnchor="middle">
            {missionName.toUpperCase()}
          </textPath>
        </text>

        <text fill="#94A3B8" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="2">
          <textPath href={`#bottomArc-${uniqueId}`} startOffset="50%" textAnchor="middle">
            MOONLANDER • {seed}
          </textPath>
        </text>

        {/* 3. Inner Decorative Border */}
        <circle cx="150" cy="150" r="98" fill="none" stroke="#334155" strokeWidth="2" />
        <circle cx="150" cy="150" r="95" fill={`url(#bgGrad-${uniqueId})`} />

        {/* 4. Deep Space Starfield Dots */}
        {[
          [110, 100], [180, 85], [195, 120], [90, 140], [130, 75],
          [165, 170], [80, 180], [210, 185], [125, 205], [175, 210]
        ].map(([x, y], idx) => (
          <circle key={idx} cx={x} cy={y} r={idx % 2 === 0 ? "1.2" : "0.8"} fill="#FFFFFF" opacity="0.75" />
        ))}

        {/* 5. Central Scenario Emblem */}
        {scenarioId === "earth-watch" && (
          <g>
            {/* Earth Sphere */}
            <circle cx="150" cy="165" r="44" fill="#0369A1" />
            <path d="M 125,145 Q 140,135 155,145 Q 165,160 150,175 Q 130,170 125,145 Z" fill="#15803D" />
            <path d="M 160,170 Q 175,165 180,180 Q 165,195 155,185 Z" fill="#15803D" />
            {/* Sun-synchronous Orbital Track */}
            <ellipse cx="150" cy="165" rx="56" ry="20" fill="none" stroke="#FDE047" strokeWidth="1.8" strokeDasharray="3 2" transform="rotate(-35 150 165)" />
            {/* Spacecraft Diamond */}
            <polygon points="120,130 126,126 132,130 126,134" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
          </g>
        )}

        {scenarioId === "exoplanet-hunter" && (
          <g>
            {/* Host Star Glow */}
            <circle cx="150" cy="140" r="32" fill="#FBBF24" opacity="0.3" />
            <circle cx="150" cy="140" r="24" fill="#FDE047" />
            {/* Transiting Exoplanet Silhouette */}
            <circle cx="138" cy="140" r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
            {/* Photometric Transit Light Curve */}
            <path d="M 85,190 L 125,190 L 138,206 L 162,206 L 175,190 L 215,190" fill="none" stroke="#38BDF8" strokeWidth="2.5" />
          </g>
        )}

        {scenarioId === "space-weather-sentinel" && (
          <g>
            {/* Sun with CME Eruption Loops */}
            <circle cx="150" cy="160" r="32" fill="#EA580C" />
            <circle cx="150" cy="160" r="26" fill="#F59E0B" />
            <path d="M 130,140 Q 150,105 170,140" fill="none" stroke="#EF4444" strokeWidth="3" />
            <path d="M 120,135 Q 150,90 180,135" fill="none" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="3 2" />
          </g>
        )}

        {scenarioId === "deep-space-telescope" && (
          <g>
            {/* Hexagonal Primary Mirror Array */}
            {[-18, 0, 18].map((dx) =>
              [-15, 0, 15].map((dy) => (
                <polygon
                  key={`${dx}-${dy}`}
                  points={`${150 + dx},${145 + dy - 7} ${150 + dx + 6},${145 + dy - 3.5} ${150 + dx + 6},${145 + dy + 3.5} ${150 + dx},${145 + dy + 7} ${150 + dx - 6},${145 + dy + 3.5} ${150 + dx - 6},${145 + dy - 3.5}`}
                  fill="#F59E0B"
                  stroke="#78350F"
                  strokeWidth="0.8"
                />
              ))
            )}
            <circle cx="150" cy="145" r="4" fill="#0B132B" />
          </g>
        )}

        {(scenarioId === "lunar-pathfinder" || scenarioId === "lunar-south-pole") && (
          <g>
            {/* Moon Surface with Crater Rim */}
            <circle cx="150" cy="155" r="42" fill="#64748B" />
            <circle cx="135" cy="145" r="10" fill="#475569" stroke="#94A3B8" strokeWidth="0.8" />
            <circle cx="165" cy="165" r="14" fill="#334155" stroke="#94A3B8" strokeWidth="1" />
            <path d="M 100,185 Q 150,130 195,175" fill="none" stroke="#FDE047" strokeWidth="2" strokeDasharray="3 2" />
          </g>
        )}

        {scenarioId === "red-planet-relay" && (
          <g>
            {/* Mars Red Planet */}
            <circle cx="150" cy="150" r="38" fill="#C2410C" />
            <ellipse cx="145" cy="135" rx="8" ry="4" fill="#9A3412" opacity="0.8" />
            <circle cx="150" cy="115" r="6" fill="#FFFFFF" opacity="0.9" /> {/* North Polar Ice Cap */}
            <ellipse cx="150" cy="150" rx="55" ry="18" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 2" transform="rotate(25 150 150)" />
          </g>
        )}

        {/* Fallback generic orbital vector */}
        {scenarioId === "geo-telecom-relay" && (
          <g>
            <circle cx="150" cy="150" r="32" fill="#0284C7" />
            <circle cx="150" cy="150" r="54" fill="none" stroke="#FDE047" strokeWidth="2" />
            <polygon points="204,150 200,144 208,144" fill="#38BDF8" />
          </g>
        )}

        {/* 6. Gold Rocket Vector Chevron */}
        <path d="M 140,225 L 150,85 L 160,225 L 150,215 Z" fill="#F59E0B" opacity="0.85" />
        <path d="M 145,225 L 150,95 L 155,225 Z" fill="#FDE047" />

        {/* 7. Center Grade Insignia Stamp */}
        <g transform="translate(150, 245)">
          <polygon points="-16,-9 16,-9 22,0 16,9 -16,9 -22,0" fill="#0F172A" stroke={gradeBorderColor} strokeWidth="1.5" />
          <text textAnchor="middle" y="4" fill={gradeBorderColor} fontSize="11" fontFamily="'Barlow Condensed', sans-serif" fontWeight="700">
            CLASS {grade}
          </text>
        </g>
      </svg>

      {showDownload && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadSvg}
          className="flex items-center gap-1.5 text-xs font-mono"
        >
          <Download className="w-3.5 h-3.5 text-telemetry-amber" />
          <span>Download Patch SVG</span>
        </Button>
      )}
    </div>
  );
};
