"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMissionStore } from "@/store/mission";
import {
  createGoldMliTexture,
  createMliNormalMap,
  createSolarCellTexture,
} from "./proceduralTextures";
import { loadGltfModelSafe } from "./modelLoader";

export const Spacecraft: React.FC<{ autoRotate?: boolean }> = ({ autoRotate = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);

  const { currentMission } = useMissionStore();

  const [customModelScene, setCustomModelScene] = useState<THREE.Group | null>(null);

  // Check if a custom GLTF model exists in public/models/<id>.glb
  useEffect(() => {
    let isCancelled = false;
    loadGltfModelSafe(currentMission.busId).then((res) => {
      if (!isCancelled && res.isCustomModel && res.scene) {
        setCustomModelScene(res.scene);
      } else if (!isCancelled) {
        setCustomModelScene(null);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [currentMission.busId]);

  // Create PBR procedural textures
  const goldMliTexture = useMemo(() => createGoldMliTexture(), []);
  const mliNormalMap = useMemo(() => createMliNormalMap(), []);
  const solarTexture = useMemo(
    () => createSolarCellTexture(currentMission.solarArrayId === "solar-gaas-triple"),
    [currentMission.solarArrayId]
  );

  // Sizing parameters derived from bus and design metrics
  const busDiameter = Math.max(
    0.6,
    Math.min(
      2.5,
      currentMission.busId === "bus-cubesat-12u"
        ? 0.45
        : currentMission.busId === "bus-microsat"
        ? 0.9
        : currentMission.busId === "bus-smallsat"
        ? 1.4
        : currentMission.busId === "bus-midsize"
        ? 2.0
        : 2.5
    )
  );
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

    // Deploy animation ease-in to 0 degrees with smooth hinge dampening
    if (leftWingRef.current && Math.abs(leftWingRef.current.rotation.z) > 0.005) {
      leftWingRef.current.rotation.z = THREE.MathUtils.lerp(
        leftWingRef.current.rotation.z,
        0,
        delta * 3.5
      );
    }
    if (rightWingRef.current && Math.abs(rightWingRef.current.rotation.z) > 0.005) {
      rightWingRef.current.rotation.z = THREE.MathUtils.lerp(
        rightWingRef.current.rotation.z,
        0,
        delta * 3.5
      );
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      {/* If custom GLB model exists, render it; otherwise render procedural PBR model */}
      {customModelScene ? (
        <primitive object={customModelScene} />
      ) : (
        <group>
          {/* 1. Main Spacecraft Central Bus Chassis with Crinkled MLI Foil */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[busDiameter, busHeight, busDiameter]} />
            <meshStandardMaterial
              map={goldMliTexture}
              normalMap={mliNormalMap}
              normalScale={new THREE.Vector2(0.4, 0.4)}
              color="#D4AF37"
              roughness={0.25}
              metalness={0.92}
            />
          </mesh>

          {/* White Thermal Radiator Side Panels */}
          <mesh position={[busDiameter / 2 + 0.005, 0, 0]}>
            <planeGeometry args={[busDiameter * 0.7, busHeight * 0.6]} />
            <meshStandardMaterial
              color="#F8FAFC"
              roughness={0.85}
              metalness={0.05}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[-busDiameter / 2 - 0.005, 0, 0]}>
            <planeGeometry args={[busDiameter * 0.7, busHeight * 0.6]} />
            <meshStandardMaterial
              color="#F8FAFC"
              roughness={0.85}
              metalness={0.05}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Structural Corner Struts / Edge Rails (Brushed Aluminium) */}
          <mesh position={[busDiameter / 2, 0, busDiameter / 2]}>
            <cylinderGeometry args={[0.02, 0.02, busHeight * 1.02, 8]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.88} roughness={0.35} />
          </mesh>
          <mesh position={[-busDiameter / 2, 0, busDiameter / 2]}>
            <cylinderGeometry args={[0.02, 0.02, busHeight * 1.02, 8]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.88} roughness={0.35} />
          </mesh>
          <mesh position={[busDiameter / 2, 0, -busDiameter / 2]}>
            <cylinderGeometry args={[0.02, 0.02, busHeight * 1.02, 8]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.88} roughness={0.35} />
          </mesh>
          <mesh position={[-busDiameter / 2, 0, -busDiameter / 2]}>
            <cylinderGeometry args={[0.02, 0.02, busHeight * 1.02, 8]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.88} roughness={0.35} />
          </mesh>
        </group>
      )}

      {/* 2. Deployable Solar Arrays (Left & Right Wings) */}
      {/* Left Wing */}
      <group
        ref={leftWingRef}
        position={[-busDiameter / 2 - 0.05, 0, 0]}
        rotation={[0, 0, 0.45]}
      >
        {/* Support Yoke / Boom */}
        <mesh position={[-0.15, 0, 0]}>
          <boxGeometry args={[0.3, 0.06, 0.06]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} />
        </mesh>
        {/* Solar Panel Blade */}
        <mesh position={[-0.3 - wingWidth / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[wingWidth, wingHeight, 0.03]} />
          <meshStandardMaterial
            map={solarTexture}
            color="#0F172A"
            roughness={0.2}
            metalness={0.75}
          />
        </mesh>
      </group>

      {/* Right Wing */}
      <group
        ref={rightWingRef}
        position={[busDiameter / 2 + 0.05, 0, 0]}
        rotation={[0, 0, -0.45]}
      >
        {/* Support Yoke / Boom */}
        <mesh position={[0.15, 0, 0]}>
          <boxGeometry args={[0.3, 0.06, 0.06]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} />
        </mesh>
        {/* Solar Panel Blade */}
        <mesh position={[0.3 + wingWidth / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[wingWidth, wingHeight, 0.03]} />
          <meshStandardMaterial
            map={solarTexture}
            color="#0F172A"
            roughness={0.2}
            metalness={0.75}
          />
        </mesh>
      </group>

      {/* 3. Communications Antenna Subsystem */}
      {hasParabolicDish && (
        <group position={[0, busHeight / 2 + 0.05, -busDiameter * 0.25]}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.2, 12]} />
            <meshStandardMaterial color="#4A5568" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Parabolic Dish Reflector */}
          <mesh position={[0, 0.25, 0]} rotation={[0.4, 0, 0]}>
            <coneGeometry args={[0.35, 0.12, 24, 1, true]} />
            <meshStandardMaterial
              color="#F8FAFC"
              metalness={0.7}
              roughness={0.25}
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
      {hasTelescope && (
        <group position={[0, busHeight / 2 + 0.25, busDiameter * 0.15]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.25, 0.5, 24]} />
            <meshStandardMaterial color="#0F172A" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <torusGeometry args={[0.22, 0.02, 16, 32]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}

      {hasTransitPhotometer && (
        <group position={[0, busHeight / 2 + 0.12, 0]}>
          <mesh position={[-0.18, 0.1, -0.18]}>
            <cylinderGeometry args={[0.09, 0.09, 0.22, 16]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.18, 0.1, -0.18]}>
            <cylinderGeometry args={[0.09, 0.09, 0.22, 16]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.18, 0.1, 0.18]}>
            <cylinderGeometry args={[0.09, 0.09, 0.22, 16]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.18, 0.1, 0.18]}>
            <cylinderGeometry args={[0.09, 0.09, 0.22, 16]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      )}

      {hasSAR && (
        <group position={[0, -busHeight / 2 - 0.1, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[busDiameter * 1.8, 0.04, 0.4]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      )}

      {/* 5. Propulsion Thruster Nozzle Assembly */}
      <group position={[0, -busHeight / 2 - 0.15, 0]}>
        {isElectric ? (
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.16, 24]} />
            <meshStandardMaterial
              color="#0EA5E9"
              emissive="#0284C7"
              emissiveIntensity={0.6}
              roughness={0.3}
            />
          </mesh>
        ) : (
          <mesh position={[0, 0, 0]}>
            <coneGeometry args={[0.18, 0.35, 24, 1, true]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.9}
              roughness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    </group>
  );
};
