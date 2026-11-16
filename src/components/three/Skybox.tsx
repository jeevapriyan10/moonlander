"use client";

import React, { useState, useEffect } from "react";
import * as THREE from "three";
import {
  loadTextureSafe,
  getEffectiveTextureTier,
  type ResolutionTier,
} from "./textureManager";
import { useSettingsStore } from "@/store/settings";

export const Skybox: React.FC = () => {
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const tier: ResolutionTier = getEffectiveTextureTier(graphicsQuality);

    loadTextureSafe("stars", "milkyway", tier).then((tex) => {
      if (!isCancelled) {
        setTexture(tex);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [graphicsQuality]);

  return (
    <mesh renderOrder={-1000}>
      <sphereGeometry args={[1400, 64, 32]} />
      <meshBasicMaterial
        map={texture || undefined}
        color={texture ? "#B0C4DE" : "#020408"}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
};
