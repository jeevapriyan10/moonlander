"use client";

import React, { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { useSettingsStore } from "@/store/settings";

export type CameraPreset = "spacecraft" | "orbit" | "solar-system" | "earth" | "free";

interface CameraRigProps {
  preset?: CameraPreset;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
  target?: [number, number, number];
}

const PRESET_CONFIGS: Record<
  CameraPreset,
  { position: [number, number, number]; target: [number, number, number]; minDistance: number; maxDistance: number }
> = {
  spacecraft: {
    position: [2.5, 1.8, 3.8],
    target: [0, 0, 0],
    minDistance: 1.2,
    maxDistance: 12.0,
  },
  orbit: {
    position: [0, 24, 38],
    target: [0, 0, 0],
    minDistance: 8.0,
    maxDistance: 150.0,
  },
  "solar-system": {
    position: [0, 75, 100],
    target: [0, 0, 0],
    minDistance: 12.0,
    maxDistance: 400.0,
  },
  earth: {
    position: [0, 1.2, 7.5],
    target: [0, 0, 0],
    minDistance: 3.5,
    maxDistance: 25.0,
  },
  free: {
    position: [4, 3, 5],
    target: [0, 0, 0],
    minDistance: 1.0,
    maxDistance: 200.0,
  },
};

export const CameraRig: React.FC<CameraRigProps> = ({
  preset = "spacecraft",
  autoRotate = false,
  autoRotateSpeed = 0.5,
  minDistance,
  maxDistance,
  target,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  const config = PRESET_CONFIGS[preset];
  const targetVec = useRef(new THREE.Vector3(...(target ?? config.target)));
  const desiredPos = useRef(new THREE.Vector3(...config.position));

  useEffect(() => {
    const nextConfig = PRESET_CONFIGS[preset];
    desiredPos.current.set(...nextConfig.position);
    targetVec.current.set(...(target ?? nextConfig.target));

    if (reducedMotion) {
      camera.position.copy(desiredPos.current);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetVec.current);
        controlsRef.current.update();
      }
    }
  }, [preset, target, camera, reducedMotion]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (!reducedMotion) {
      // Smooth lerp toward desired target and position on preset change
      const step = Math.min(1, delta * 3.0);
      controlsRef.current.target.lerp(targetVec.current, step);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      autoRotate={autoRotate && !reducedMotion}
      autoRotateSpeed={autoRotateSpeed}
      minDistance={minDistance ?? config.minDistance}
      maxDistance={maxDistance ?? config.maxDistance}
      makeDefault
    />
  );
};
