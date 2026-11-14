"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMissionStore } from "@/store/mission";
import { createGoldMliTexture, createSolarCellTexture } from "./proceduralTextures";

export const Spacecraft: React.FC<{ autoRotate?: boolean }> = ({ autoRotate = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);

  const { currentMission, evaluation } = useMissionStore();

  // Create PBR procedural textures
  const goldMliTexture = useMemo(() => createGoldMliTexture(), []);
  const solarTexture = useMemo(
    () => createSolarCellTexture(currentMission.solarArrayId === "solar-gaas-triple"),
    [currentMission.solarArrayId]
  );

  // Sizing parameters derived from bus and design metrics
  const busDiameter = Math.max(0.6, Math.min(2.5, currentMission.busId === "bus-cubesat-12u" ? 0.4 : currentMission.busId === "bus-microsat" ? 0.9 : currentMission.busId === "bus-smallsat" ? 1.4 : currentMission.busId === "bus-midsize" ? 2.0 : 2.5));
  const busHeight = busDiameter * 1.3;

  // Solar array geometry sizing: Total area split across two symmetrical wings
  const wingArea = Math.max(0.5, currentMission.solarArrayAreaM2 / 2);
  const wingAspect = 2.4;
  const wingWidth = Math.sqrt(wingArea * wingAspect);
  const wingHeight = wingArea / wingWidth;

  // Comms dish geometry
  const hasParabolicDish =
    currentMission.commsId === "comms-x-band" ||
    currentMission.commsId === "comms-ka-band" ||
    currentMission.commsId === "comms-dsn-hga";
  const hasLaserTurret = currentMission.commsId === "comms-optical-laser";

  // Propulsion type
  const isElectric = currentMission.propulsionId === "prop-hall-electric";

  // Instrument flags
  const hasSAR = currentMission.selectedInstrumentIds.includes("inst-sar-radar");
  const hasTelescope =
    currentMission.selectedInstrumentIds.includes("inst-multispectral") ||
    currentMission.selectedInstrumentIds.includes("inst-highres-pan");
  const hasTransitPhotometer = currentMission.selectedInstrumentIds.includes("inst-transit-photometer");

  // Gentle floating rotation and solar array deployment animation
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }

    // Deploy animation ease-in to 0 degrees
    if (leftWingRef.current && leftWingRef.current.rotation.z > 0.01) {
      leftWingRef.current.rotation.z = THREE.MathUtils.lerp(leftWingRef.current.rotation.z, 0, delta * 3);
    }
    if (rightWingRef.current && rightWingRef.current.rotation.z < -0.01) {
      rightWingRef.current.rotation.z = THREE.MathUtils.lerp(rightWingRef.current.rotation.z, 0, delta * 3);
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      {/* 1. Main Spacecraft Central Bus Chassis */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[busDiameter, busHeight, busDiameter]} />
        <meshStandardMaterial
          map={goldMliTexture}
          color="#D4AF37"
          roughness={0.25}
          metalness={0.9}
        />
      </mesh>

      {/* Structural Corner Struts / Edge Rails */}
      <mesh position={[busDiameter / 2, 0, busDiameter / 2]}>
        <cylinderGeometry args={[0.02, 0.02, busHeight * 1.02, 8]} />
        <meshStandardMaterial color="#4A5568" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-busDiameter / 2, 0, busDiameter / 2]}>
        <cylinderGeometry args={[0.02, 0.02, busHeight * 1.02, 8]} />
        <meshStandardMaterial color="#4A5568" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[busDiameter / 2, 0, -busDiameter / 2]}>
        <cylinderGeometry args={[0.02, 0.02, busHeight * 1.02, 8]} />
        <meshStandardMaterial color="#4A5568" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-busDiameter / 2, 0, -busDiameter / 2]}>
        <cylinderGeometry args={[0.02, 0.02, busHeight * 1.02, 8]} />
        <meshStandardMaterial color="#4A5568" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 2. Deployable Solar Arrays (Left & Right Wings) */}
      {/* Left Wing */}
      <group
        ref={leftWingRef}
        position={[-busDiameter / 2 - 0.05, 0, 0]}
        rotation={[0, 0, 0.4]}
      >
        {/* Support Yoke / Boom */}
        <mesh position={[-0.15, 0, 0]}>
          <boxGeometry args={[0.3, 0.06, 0.06]} />
          <meshStandardMaterial color="#2D3748" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Solar Panel Blade */}
        <mesh
          position={[-0.3 - wingWidth / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[wingWidth, wingHeight, 0.03]} />
          <meshStandardMaterial
            map={solarTexture}
            color="#0F172A"
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
      </group>

      {/* Right Wing */}
      <group
        ref={rightWingRef}
        position={[busDiameter / 2 + 0.05, 0, 0]}
        rotation={[0, 0, -0.4]}
      >
        {/* Support Yoke / Boom */}
        <mesh position={[0.15, 0, 0]}>
          <boxGeometry args={[0.3, 0.06, 0.06]} />
          <meshStandardMaterial color="#2D3748" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Solar Panel Blade */}
        <mesh
          position={[0.3 + wingWidth / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[wingWidth, wingHeight, 0.03]} />
          <meshStandardMaterial
            map={solarTexture}
            color="#0F172A"
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
      </group>

      {/* 3. Communications Antenna Subsystem */}
      {hasParabolicDish && (
        <group position={[0, busHeight / 2 + 0.05, -busDiameter * 0.25]}>
          {/* Gimbal Pedestal */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.2, 12]} />
            <meshStandardMaterial color="#4A5568" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Parabolic Dish Reflector */}
          <mesh position={[0, 0.25, 0]} rotation={[0.4, 0, 0]}>
            <coneGeometry args={[0.35, 0.12, 24, 1, true]} />
            <meshStandardMaterial
              color="#F8FAFC"
              metalness={0.6}
              roughness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Feed Horn Stent */}
          <mesh position={[0, 0.35, 0.05]}>
            <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
            <meshStandardMaterial color="#D97706" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}

      {hasLaserTurret && (
        <group position={[0, busHeight / 2 + 0.08, -busDiameter * 0.25]}>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.08, 0.08]} rotation={[0.6, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.1, 16]} />
            <meshStandardMaterial color="#0284C7" metalness={0.8} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* 4. Scientific Instruments */}
      {/* Optical Telescope Baffle (Nadir-pointing bottom or top) */}
      {hasTelescope && (
        <group position={[0, busHeight / 2 + 0.25, busDiameter * 0.15]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.25, 0.5, 24]} />
            <meshStandardMaterial color="#0F172A" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Gold Thermal Ring */}
          <mesh position={[0, 0.26, 0]}>
            <torusGeometry args={[0.22, 0.02, 16, 32]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* Quad TESS-like Photometer Cameras */}
      {hasTransitPhotometer && (
        <group position={[0, busHeight / 2 + 0.15, 0]}>
          {[-0.15, 0.15].map((x, xi) =>
            [-0.15, 0.15].map((z, zi) => (
              <group key={`${xi}-${zi}`} position={[x, 0, z]}>
                <mesh>
                  <cylinderGeometry args={[0.08, 0.09, 0.25, 16]} />
                  <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0.13, 0]}>
                  <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
                  <meshStandardMaterial color="#38BDF8" metalness={0.9} roughness={0.1} />
                </mesh>
              </group>
            ))
          )}
        </group>
      )}

      {/* Synthetic Aperture Radar (SAR) Flat Phased-Array Panel */}
      {hasSAR && (
        <mesh
          position={[0, 0, busDiameter / 2 + 0.08]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[busDiameter * 1.4, busHeight * 0.8, 0.05]} />
          <meshStandardMaterial
            color="#E2E8F0"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      )}

      {/* ADCS Dual Star Tracker Nubs */}
      <group position={[busDiameter / 2 + 0.02, busHeight * 0.2, 0]} rotation={[0, 0, -0.6]}>
        <mesh>
          <cylinderGeometry args={[0.03, 0.04, 0.08, 12]} />
          <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.045, 0]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color="#38BDF8" roughness={0.1} metalness={0.9} />
        </mesh>
      </group>

      {/* 5. Propulsion Thruster Assemblies (Aft / Bottom) */}
      <group position={[0, -busHeight / 2, 0]}>
        {isElectric ? (
          // Hall Thruster Annular Ring with Blue Ion Glow
          <group position={[0, -0.06, 0]}>
            <mesh>
              <cylinderGeometry args={[0.14, 0.16, 0.12, 24]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.1, 0.025, 16, 32]} />
              <meshStandardMaterial
                color="#38BDF8"
                emissive="#0284C7"
                emissiveIntensity={2.5}
                roughness={0.2}
              />
            </mesh>
          </group>
        ) : (
          // Chemical Liquid Rocket Engine Bell Nozzle
          <mesh position={[0, -0.15, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.18, 0.3, 24, 1, true]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.85}
              roughness={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    </group>
  );
};
