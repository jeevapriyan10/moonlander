"use client";

import React, { useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import {
  getBodyEphemeris,
  solveLambert,
  AU_TO_KM,
} from "@/engine/interplanetary";
import {
  loadTextureSafe,
  getEffectiveTextureTier,
  type CelestialBody,
  type ResolutionTier,
} from "./textureManager";
import { useSettingsStore } from "@/store/settings";
import { Sun } from "./Sun";
import { Saturn } from "./Saturn";

export interface SolarSystemViewProps {
  daysFromJ2000?: number;
  targetBodyId?: string;
  scaleMode?: "readable" | "true";
  onSelectPlanet?: (planetId: string) => void;
}

// Visual scaling factor: 1 AU = 25 Three.js scene units
const AU_SCALE = 25.0;

interface PlanetVisualConfig {
  id: CelestialBody;
  name: string;
  color: string;
  readableSize: number;
  trueScaleRatio: number; // Ratio relative to Earth
  orbitRadiusAU: number;
  rotationSpeed: number;
  axialTiltDeg: number;
}

const PLANET_CONFIGS: PlanetVisualConfig[] = [
  { id: "mercury", name: "Mercury", color: "#9CA3AF", readableSize: 0.45, trueScaleRatio: 0.38, orbitRadiusAU: 0.387, rotationSpeed: 0.005, axialTiltDeg: 0.03 },
  { id: "venus", name: "Venus", color: "#FBBF24", readableSize: 0.75, trueScaleRatio: 0.95, orbitRadiusAU: 0.723, rotationSpeed: -0.002, axialTiltDeg: 177.36 },
  { id: "earth", name: "Earth", color: "#38BDF8", readableSize: 0.8, trueScaleRatio: 1.0, orbitRadiusAU: 1.0, rotationSpeed: 0.03, axialTiltDeg: 23.44 },
  { id: "mars", name: "Mars", color: "#EF4444", readableSize: 0.6, trueScaleRatio: 0.53, orbitRadiusAU: 1.524, rotationSpeed: 0.028, axialTiltDeg: 25.19 },
  { id: "jupiter", name: "Jupiter", color: "#F97316", readableSize: 2.0, trueScaleRatio: 11.2, orbitRadiusAU: 5.204, rotationSpeed: 0.07, axialTiltDeg: 3.13 },
  { id: "saturn", name: "Saturn", color: "#FBBF24", readableSize: 1.7, trueScaleRatio: 9.45, orbitRadiusAU: 9.582, rotationSpeed: 0.065, axialTiltDeg: 26.73 },
  { id: "uranus", name: "Uranus", color: "#67E8F9", readableSize: 1.2, trueScaleRatio: 4.0, orbitRadiusAU: 19.22, rotationSpeed: -0.04, axialTiltDeg: 97.77 },
  { id: "neptune", name: "Neptune", color: "#3B82F6", readableSize: 1.15, trueScaleRatio: 3.88, orbitRadiusAU: 30.05, rotationSpeed: 0.045, axialTiltDeg: 28.32 },
];

// Pure Three.js Billboard Sprite for Planet Label (Zero React Fiber reconciler interference)
const PlanetLabelSprite: React.FC<{
  name: string;
  distanceAU: number;
  isSelected: boolean;
  isTarget: boolean;
  position: [number, number, number];
  onClick: () => void;
}> = ({ name, distanceAU, isSelected, isTarget, position, onClick }) => {
  const sprite = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background pill styling
    ctx.fillStyle = isSelected
      ? "rgba(245, 158, 11, 0.95)"
      : isTarget
      ? "rgba(245, 158, 11, 0.35)"
      : "rgba(5, 7, 13, 0.85)";
    ctx.strokeStyle = isSelected
      ? "#FCD34D"
      : isTarget
      ? "#F59E0B"
      : "rgba(71, 85, 105, 0.7)";
    ctx.lineWidth = 2.5;

    // Draw rounded rect
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(8 + r, 8);
    ctx.lineTo(248 - r, 8);
    ctx.quadraticCurveTo(248, 8, 248, 8 + r);
    ctx.lineTo(248, 56 - r);
    ctx.quadraticCurveTo(248, 56, 248 - r, 56);
    ctx.lineTo(8 + r, 56);
    ctx.quadraticCurveTo(8, 56, 8, 56 - r);
    ctx.lineTo(8, 8 + r);
    ctx.quadraticCurveTo(8, 8, 8 + r, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Planet Name and AU readout
    ctx.font = "bold 20px monospace";
    ctx.fillStyle = isSelected ? "#05070D" : "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${name} ${distanceAU.toFixed(2)} AU`, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true,
    });
    const s = new THREE.Sprite(material);
    s.scale.set(3.4, 0.85, 1);
    return s;
  }, [name, distanceAU, isSelected, isTarget]);

  if (!sprite) return null;
  return <primitive object={sprite} position={position} onClick={onClick} />;
};

/**
 * Scale-accurate 3D Heliocentric Solar System Viewport
 * Displays Keplerian orbits, textured planetary bodies, and interplanetary transfer trajectories.
 */
export const SolarSystemView: React.FC<SolarSystemViewProps> = ({
  daysFromJ2000 = 8500, // Year ~2023
  targetBodyId = "mars",
  scaleMode = "readable",
  onSelectPlanet,
}) => {
  const [selectedPlanet, setSelectedPlanet] = useState<string>(targetBodyId);
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality);
  const [planetTextures, setPlanetTextures] = useState<Partial<Record<CelestialBody, THREE.Texture>>>({});

  const handleSelect = (planetId: string) => {
    setSelectedPlanet(planetId);
    if (onSelectPlanet) {
      onSelectPlanet(planetId);
    }
  };

  // Pre-load textures for planets
  useEffect(() => {
    let isCancelled = false;
    const tier: ResolutionTier = getEffectiveTextureTier(graphicsQuality);

    async function loadAll() {
      const texMap: Partial<Record<CelestialBody, THREE.Texture>> = {};
      const loadPromises = PLANET_CONFIGS.map(async (p) => {
        const tex = await loadTextureSafe(p.id, "color", tier);
        texMap[p.id] = tex;
      });
      await Promise.all(loadPromises);
      if (!isCancelled) {
        setPlanetTextures(texMap);
      }
    }

    loadAll();
    return () => {
      isCancelled = true;
    };
  }, [graphicsQuality]);

  // Compute 3D positions of all bodies at departure epoch via analytical ephemeris
  const bodyPositions = useMemo(() => {
    const positions: Record<string, [number, number, number]> = {};
    for (const p of PLANET_CONFIGS) {
      const eph = getBodyEphemeris(p.id, daysFromJ2000);
      positions[p.id] = [
        eph.positionAU.x * AU_SCALE,
        eph.positionAU.z * AU_SCALE,
        eph.positionAU.y * AU_SCALE,
      ];
    }
    return positions;
  }, [daysFromJ2000]);

  // Orbit line Three.js objects with gradient fade
  const orbitLines = useMemo(() => {
    return PLANET_CONFIGS.map((planet) => {
      const radius = planet.orbitRadiusAU * AU_SCALE;
      const points: THREE.Vector3[] = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const isTarget = planet.id === targetBodyId;
      const mat = new THREE.LineBasicMaterial({
        color: isTarget ? 0xf59e0b : 0x334155,
        transparent: true,
        opacity: isTarget ? 0.85 : 0.4,
      });
      return { id: planet.id, lineObj: new THREE.Line(geo, mat) };
    });
  }, [targetBodyId]);

  // Compute Lambert transfer arc from Earth to target body
  const transferLineObj = useMemo(() => {
    const earthEph = getBodyEphemeris("earth", daysFromJ2000);
    const targetKey = targetBodyId === "jupiter" ? "jupiter" : "mars";
    const targetEph = getBodyEphemeris(targetKey, daysFromJ2000 + 210);

    const earthPosKm = {
      x: earthEph.positionAU.x * AU_TO_KM,
      y: earthEph.positionAU.y * AU_TO_KM,
      z: earthEph.positionAU.z * AU_TO_KM,
    };
    const targetPosKm = {
      x: targetEph.positionAU.x * AU_TO_KM,
      y: targetEph.positionAU.y * AU_TO_KM,
      z: targetEph.positionAU.z * AU_TO_KM,
    };

    const tofSec = 210 * 86400;
    solveLambert(earthPosKm, targetPosKm, tofSec);

    const points: THREE.Vector3[] = [];
    const numSteps = 60;

    for (let i = 0; i <= numSteps; i++) {
      const frac = i / numSteps;
      const angle = frac * Math.PI;
      const xKm = earthPosKm.x * (1 - frac) + targetPosKm.x * frac;
      const yKm = earthPosKm.y * (1 - frac) + targetPosKm.y * frac + Math.sin(angle) * (0.2 * AU_TO_KM);
      const zKm = earthPosKm.z * (1 - frac) + targetPosKm.z * frac;

      points.push(
        new THREE.Vector3(
          (xKm / AU_TO_KM) * AU_SCALE,
          (zKm / AU_TO_KM) * AU_SCALE,
          (yKm / AU_TO_KM) * AU_SCALE
        )
      );
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    return new THREE.Line(geo, mat);
  }, [daysFromJ2000, targetBodyId]);

  return (
    <group dispose={null}>
      {/* Central High-Fidelity Animated Sun */}
      <Sun radius={scaleMode === "true" ? 3.0 : 2.5} position={[0, 0, 0]} />

      {/* Planetary Orbit Rings & Bodies */}
      {PLANET_CONFIGS.map((planet) => {
        const radius = planet.orbitRadiusAU * AU_SCALE;
        const pos = bodyPositions[planet.id] ?? [radius, 0, 0];
        const isTarget = planet.id === targetBodyId;
        const isSelected = planet.id === selectedPlanet;
        const orbitLine = orbitLines.find((ol) => ol.id === planet.id);
        const texture = planetTextures[planet.id];

        // Determine body visual radius
        const bodySize =
          scaleMode === "true"
            ? Math.max(0.2, planet.trueScaleRatio * 0.25)
            : planet.readableSize;

        return (
          <group key={planet.id}>
            {orbitLine && <primitive object={orbitLine.lineObj} />}

            <group position={pos}>
              {planet.id === "saturn" ? (
                <Saturn radius={bodySize} />
              ) : (
                <mesh
                  onClick={() => handleSelect(planet.id)}
                  castShadow
                  receiveShadow
                  rotation={[THREE.MathUtils.degToRad(planet.axialTiltDeg), 0, 0]}
                >
                  <sphereGeometry args={[bodySize, 48, 48]} />
                  <meshStandardMaterial
                    map={texture || undefined}
                    color={texture ? "#FFFFFF" : planet.color}
                    roughness={0.7}
                    metalness={0.05}
                  />
                </mesh>
              )}

              {/* Target Marker Ring */}
              {isTarget && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[bodySize * 1.4, bodySize * 1.6, 32]} />
                  <meshBasicMaterial color="#F59E0B" side={THREE.DoubleSide} />
                </mesh>
              )}

              {/* 3D Native Sprite World-Space Name Label (Zero React Fiber DOM reconciliation issues) */}
              <PlanetLabelSprite
                name={planet.name}
                distanceAU={planet.orbitRadiusAU}
                isSelected={isSelected}
                isTarget={isTarget}
                position={[0, bodySize + 0.9, 0]}
                onClick={() => handleSelect(planet.id)}
              />
            </group>
          </group>
        );
      })}

      {/* Interplanetary Lambert Transfer Trajectory */}
      <primitive object={transferLineObj} />
    </group>
  );
};
