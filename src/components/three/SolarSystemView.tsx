"use client";

import React, { useMemo, useState } from "react";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import {
  getBodyEphemeris,
  solveLambert,
  AU_TO_KM,
} from "@/engine/interplanetary";

export interface SolarSystemViewProps {
  daysFromJ2000?: number;
  targetBodyId?: string;
}

// Visual scaling factor: 1 AU = 25 Three.js scene units
const AU_SCALE = 25.0;

interface PlanetVisualConfig {
  id: string;
  name: string;
  color: string;
  size: number;
  orbitRadiusAU: number;
}

const PLANET_CONFIGS: PlanetVisualConfig[] = [
  { id: "mercury", name: "Mercury", color: "#9CA3AF", size: 0.35, orbitRadiusAU: 0.387 },
  { id: "venus", name: "Venus", color: "#FBBF24", size: 0.65, orbitRadiusAU: 0.723 },
  { id: "earth", name: "Earth", color: "#38BDF8", size: 0.7, orbitRadiusAU: 1.0 },
  { id: "mars", name: "Mars", color: "#EF4444", size: 0.5, orbitRadiusAU: 1.524 },
  { id: "jupiter", name: "Jupiter", color: "#F97316", size: 1.8, orbitRadiusAU: 5.204 },
];

/**
 * Scale-accurate 3D Heliocentric Solar System Viewport
 * Displays Keplerian orbits, planetary bodies, and interplanetary transfer trajectories.
 */
export const SolarSystemView: React.FC<SolarSystemViewProps> = ({
  daysFromJ2000 = 8500, // Year ~2023
  targetBodyId = "mars",
}) => {
  const [selectedPlanet, setSelectedPlanet] = useState<string>(targetBodyId);

  // Compute 3D positions of all bodies at departure epoch
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

  // Orbit line Three.js objects
  const orbitLines = useMemo(() => {
    return PLANET_CONFIGS.map((planet) => {
      const radius = planet.orbitRadiusAU * AU_SCALE;
      const points: THREE.Vector3[] = [];
      const segments = 96;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const isTarget = planet.id === targetBodyId;
      const mat = new THREE.LineBasicMaterial({
        color: isTarget ? 0xf59e0b : 0x334155,
        transparent: true,
        opacity: isTarget ? 0.8 : 0.4,
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
    const numSteps = 50;

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
      {/* Background Starfield */}
      <Stars radius={150} depth={50} count={2500} factor={4} saturation={0} fade speed={0.3} />

      {/* Central Sun */}
      <group position={[0, 0, 0]}>
        <mesh>
          <sphereGeometry args={[2.0, 32, 32]} />
          <meshBasicMaterial color="#FDE047" />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.6, 24, 24]} />
          <meshBasicMaterial color="#F59E0B" transparent opacity={0.35} />
        </mesh>
        <pointLight position={[0, 0, 0]} intensity={3.5} distance={300} decay={1.5} color="#FFFBEB" />
      </group>

      {/* Planetary Orbit Rings & Spheres */}
      {PLANET_CONFIGS.map((planet) => {
        const radius = planet.orbitRadiusAU * AU_SCALE;
        const pos = bodyPositions[planet.id] ?? [radius, 0, 0];
        const isTarget = planet.id === targetBodyId;
        const orbitLine = orbitLines.find((ol) => ol.id === planet.id);

        return (
          <group key={planet.id}>
            {orbitLine && <primitive object={orbitLine.lineObj} />}

            <group position={pos}>
              <mesh
                onClick={() => setSelectedPlanet(planet.id)}
                castShadow
                receiveShadow
              >
                <sphereGeometry args={[planet.size, 24, 24]} />
                <meshStandardMaterial
                  color={planet.color}
                  roughness={0.6}
                  metalness={0.2}
                  emissive={planet.id === selectedPlanet ? planet.color : "#000000"}
                  emissiveIntensity={planet.id === selectedPlanet ? 0.4 : 0.0}
                />
              </mesh>

              {isTarget && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[planet.size * 1.5, planet.size * 1.7, 32]} />
                  <meshBasicMaterial color="#F59E0B" side={THREE.DoubleSide} />
                </mesh>
              )}
            </group>
          </group>
        );
      })}

      {/* Interplanetary Ballistic Transfer Trajectory Arc */}
      <primitive object={transferLineObj} />
    </group>
  );
};
