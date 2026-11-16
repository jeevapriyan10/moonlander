"use client";

import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import {
  loadTextureSafe,
  getEffectiveTextureTier,
  type ResolutionTier,
} from "./textureManager";
import { useSettingsStore } from "@/store/settings";

export interface MoonProps {
  radius?: number; // In Three.js units (default ~1.737 for Earth=6.378)
  position?: [number, number, number];
  sunDirection?: [number, number, number];
}

export const Moon: React.FC<MoonProps> = ({
  radius = 1.737,
  position = [0, 0, 0],
  sunDirection = [1, 0, 0],
}) => {
  const moonRef = useRef<THREE.Mesh>(null);
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const tier: ResolutionTier = getEffectiveTextureTier(graphicsQuality);

    loadTextureSafe("moon", "color", tier).then((tex) => {
      if (!isCancelled) setTexture(tex);
    });

    return () => {
      isCancelled = true;
    };
  }, [graphicsQuality]);

  const segments = graphicsQuality === "LOW" ? 48 : graphicsQuality === "MEDIUM" ? 64 : 96;

  return (
    <group position={position} dispose={null}>
      {/* Harsh airless lunar surface */}
      <mesh ref={moonRef} receiveShadow castShadow>
        <sphereGeometry args={[radius, segments, segments]} />
        <meshStandardMaterial
          map={texture || undefined}
          color={texture ? "#FFFFFF" : "#888888"}
          roughness={0.95} // High roughness for regolith diffuse scattering
          metalness={0.02}
        />
      </mesh>
    </group>
  );
};
