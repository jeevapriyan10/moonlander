"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMissionStore } from "@/store/mission";
import { solveKepler, trueAnomalyFromEccentric } from "@/engine/orbit";
import { degToRad } from "@/engine/units";
import { Earth } from "./Earth";

export const OrbitView: React.FC = () => {
  const satelliteMarkerRef = useRef<THREE.Group>(null);
  const velocityVectorRef = useRef<THREE.ArrowHelper>(null);

  const { evaluation, currentMission } = useMissionStore();
  const { orbit } = evaluation;

  // 1 unit = 1000 km
  const R_E = 6.378137;
  const isDeepSpace =
    currentMission.orbitId === "l1-halo" ||
    currentMission.orbitId === "llo-100" ||
    currentMission.orbitId === "lmo-400";

  // Scale down orbital parameters if lunar/deep-space to keep visible in viewport
  const displayScale = isDeepSpace ? 0.05 : 0.001;
  const a = Math.max(7.0, Math.min(45.0, (orbit.semiMajorAxisKm || 7078) * displayScale));
  const e = Math.min(0.85, orbit.eccentricity || 0);
  const incRad = degToRad(currentMission.orbitId === "sso-700" ? 98.2 : currentMission.orbitId === "leo-500" ? 51.6 : 30.0);

  // Generate 128 orbital trajectory ellipse points
  const orbitPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const numPoints = 128;
    for (let i = 0; i <= numPoints; i++) {
      const nu = (i / numPoints) * Math.PI * 2;
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
      const x = r * Math.cos(nu);
      const z = r * Math.sin(nu);
      points.push(new THREE.Vector3(x, 0, z));
    }
    return points;
  }, [a, e]);

  const orbitLineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(orbitPoints);
  }, [orbitPoints]);

  const orbitLine = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: "#4FD1FF",
      opacity: 0.65,
      transparent: true,
      linewidth: 2,
    });
    return new THREE.Line(orbitLineGeometry, mat);
  }, [orbitLineGeometry]);

  // Animated satellite propagation around orbit
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.4;
    const meanMotion = (2 * Math.PI) / Math.max(5, a);
    const M = (t * meanMotion) % (Math.PI * 2);
    const E = solveKepler(M, e);
    const nu = trueAnomalyFromEccentric(E, e);
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));

    const x = r * Math.cos(nu);
    const z = r * Math.sin(nu);

    if (satelliteMarkerRef.current) {
      satelliteMarkerRef.current.position.set(x, 0, z);
    }
  });

  return (
    <group dispose={null}>
      {/* 1. Earth at origin */}
      <Earth radius={R_E} showClouds={true} />

      {/* 2. Earth Cylindrical Shadow Cone (Anti-Sun Direction -Z) */}
      <mesh position={[0, 0, -25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[R_E, R_E, 50, 32, 1, true]} />
        <meshBasicMaterial
          color="#030712"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Orbit Plane tilted by Inclination */}
      <group rotation={[incRad, 0, 0]}>
        {/* Orbit Ellipse Track Line */}
        <primitive object={orbitLine} />

        {/* Orbit Apsides Markers (Perigee & Apogee) */}
        <mesh position={[a * (1 - e), 0, 0]}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshBasicMaterial color="#4ADE80" />
        </mesh>
        <mesh position={[-a * (1 + e), 0, 0]}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshBasicMaterial color="#FF8A3D" />
        </mesh>

        {/* 4. Animated Satellite Marker & Trajectory Marker */}
        <group ref={satelliteMarkerRef} position={[a * (1 - e), 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial
              color="#FFB000"
              emissive="#FFB000"
              emissiveIntensity={2}
            />
          </mesh>

          {/* Velocity Vector Arrow Heading */}
          <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
            <meshBasicMaterial color="#4FD1FF" />
          </mesh>
        </group>
      </group>

      {/* Ground Station Visibility Cones on Earth Surface */}
      <group position={[0, R_E * 0.9, R_E * 0.4]}>
        <mesh>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color="#4ADE80" />
        </mesh>
        <mesh position={[0, 0.6, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[1.2, 1.2, 16, 1, true]} />
          <meshBasicMaterial
            color="#4ADE80"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Deep-Space Schematic Notice */}
      {isDeepSpace && (
        <group position={[0, -R_E - 2, 0]}>
          {/* Schematic Indicator */}
        </group>
      )}
    </group>
  );
};

