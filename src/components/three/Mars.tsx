"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  loadTextureSafe,
  getEffectiveTextureTier,
  type ResolutionTier,
} from "./textureManager";
import { useSettingsStore } from "@/store/settings";

export interface MarsProps {
  radius?: number; // In Three.js units (~3.39 for Earth=6.378)
  position?: [number, number, number];
  sunDirection?: [number, number, number];
  rotationSpeed?: number;
}

export const Mars: React.FC<MarsProps> = ({
  radius = 3.39,
  position = [0, 0, 0],
  sunDirection = [1, 0, 0],
  rotationSpeed = 0.02,
}) => {
  const marsRef = useRef<THREE.Mesh>(null);
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const tier: ResolutionTier = getEffectiveTextureTier(graphicsQuality);

    loadTextureSafe("mars", "color", tier).then((tex) => {
      if (!isCancelled) setTexture(tex);
    });

    return () => {
      isCancelled = true;
    };
  }, [graphicsQuality]);

  // Thin dusty-orange Martian limb haze shader
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(-vViewPosition);
          float rim = pow(1.0 - max(0.0, dot(N, V)), 4.0);
          vec3 dustOrange = vec3(0.95, 0.45, 0.2);
          gl_FragColor = vec4(dustOrange, rim * 0.45);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  const segments = graphicsQuality === "LOW" ? 48 : graphicsQuality === "MEDIUM" ? 64 : 96;

  return (
    <group position={position} dispose={null}>
      {/* 1. Mars Rocky Surface Sphere */}
      <mesh ref={marsRef} receiveShadow castShadow>
        <sphereGeometry args={[radius, segments, segments]} />
        <meshStandardMaterial
          map={texture || undefined}
          color={texture ? "#FFFFFF" : "#C2410C"}
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* 2. Thin Dusty Atmosphere Rim Shell */}
      <mesh material={atmosphereMaterial}>
        <sphereGeometry args={[radius * 1.012, 48, 48]} />
      </mesh>
    </group>
  );
};
