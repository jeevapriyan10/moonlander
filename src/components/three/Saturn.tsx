"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  loadTextureSafe,
  getEffectiveTextureTier,
  type ResolutionTier,
} from "./textureManager";
import { useSettingsStore } from "@/store/settings";

export interface SaturnProps {
  radius?: number; // In Three.js units (default ~5.8)
  position?: [number, number, number];
  axialTiltDeg?: number; // Saturn axial tilt = 26.73 deg
}

export const Saturn: React.FC<SaturnProps> = ({
  radius = 5.8,
  position = [0, 0, 0],
  axialTiltDeg = 26.73,
}) => {
  const saturnRef = useRef<THREE.Group>(null);
  const planetMeshRef = useRef<THREE.Mesh>(null);
  const ringMeshRef = useRef<THREE.Mesh>(null);

  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality);
  const [colorTexture, setColorTexture] = useState<THREE.Texture | null>(null);
  const [ringTexture, setRingTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const tier: ResolutionTier = getEffectiveTextureTier(graphicsQuality);

    Promise.all([
      loadTextureSafe("saturn", "color", tier),
      loadTextureSafe("saturn", "ring_alpha", tier),
    ]).then(([col, ring]) => {
      if (!isCancelled) {
        setColorTexture(col);
        setRingTexture(ring);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [graphicsQuality]);

  // Construct Ring Geometry with radial UV mapping
  const ringGeometry = useMemo(() => {
    const innerRadius = radius * 1.35;
    const outerRadius = radius * 2.35;
    const thetaSegments = graphicsQuality === "LOW" ? 64 : 128;
    const phiSegments = 16;
    const geom = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments);

    // Compute radial UVs so texture maps radially from inner edge (u=0) to outer edge (u=1)
    const pos = geom.attributes.position;
    if (pos) {
      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const r = Math.hypot(x, y);
        const u = Math.max(0, Math.min(1, (r - innerRadius) / (outerRadius - innerRadius)));
        uvs[i * 2] = u;
        uvs[i * 2 + 1] = 0.5;
      }
      geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    }
    return geom;
  }, [radius, graphicsQuality]);

  const segments = graphicsQuality === "LOW" ? 48 : graphicsQuality === "MEDIUM" ? 64 : 96;

  return (
    <group position={position} rotation={[THREE.MathUtils.degToRad(axialTiltDeg), 0, 0]} dispose={null}>
      {/* 1. Saturn Planet Sphere */}
      <mesh ref={planetMeshRef} receiveShadow castShadow>
        <sphereGeometry args={[radius, segments, segments]} />
        <meshStandardMaterial
          map={colorTexture || undefined}
          color={colorTexture ? "#FFFFFF" : "#E2BA7D"}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* 2. Saturn Ring Disc with Radial Alpha Texture (Double-Sided) */}
      <mesh
        ref={ringMeshRef}
        geometry={ringGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          map={ringTexture || undefined}
          alphaMap={ringTexture || undefined}
          color="#D8C29D"
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
};
