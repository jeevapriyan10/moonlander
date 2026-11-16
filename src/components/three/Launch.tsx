"use client";

import React, { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CanvasWrapper } from "./CanvasWrapper";
import { Spacecraft } from "./Spacecraft";
import { Earth } from "./Earth";
import {
  Rocket,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  SkipForward,
  RefreshCw,
} from "lucide-react";

// Staging event thresholds in seconds (scaled ~13.5s sequence)
const T_MECO = 4.0;
const T_FAIRING = 6.5;
const T_SECO = 9.5;
const T_SEP = 11.5;
const T_END = 13.5;

interface LaunchVehicle3DProps {
  isFinished: boolean;
  onTimeUpdate: (t: number) => void;
  onSequenceEnd: () => void;
}

/**
 * Pure Three.js 3D Ascent & Staging Sequence (Must render inside Canvas)
 */
const LaunchVehicle3D: React.FC<LaunchVehicle3DProps> = ({
  isFinished,
  onTimeUpdate,
  onSequenceEnd,
}) => {
  const tRef = useRef(0);
  const lastTelemetryRef = useRef(0);

  const vehicleRef = useRef<THREE.Group>(null);
  const stage1Ref = useRef<THREE.Group>(null);
  const stage2Ref = useRef<THREE.Group>(null);
  const fairingLeftRef = useRef<THREE.Mesh>(null);
  const fairingRightRef = useRef<THREE.Mesh>(null);
  const exhaustPlumeRef = useRef<THREE.Group>(null);
  const stage2PlumeRef = useRef<THREE.Mesh>(null);

  useFrame(({ camera }, delta) => {
    if (isFinished) return;

    const currentT = tRef.current + delta;
    tRef.current = currentT;

    if (currentT >= T_END) {
      onSequenceEnd();
      return;
    }

    // Ascent altitude & trajectory progression
    const altitude = Math.pow(currentT, 1.85) * 1.6;
    const downrange = Math.pow(currentT / T_END, 2.2) * 16;
    const pitch = Math.min(0.85, (currentT / T_END) * 0.85);

    if (vehicleRef.current) {
      vehicleRef.current.position.y = altitude;
      vehicleRef.current.position.x = downrange;
      vehicleRef.current.rotation.z = -pitch;
    }

    // Stage 1 booster exhaust plume animation
    if (exhaustPlumeRef.current) {
      if (currentT < T_MECO) {
        exhaustPlumeRef.current.scale.y = 1.0 + Math.sin(currentT * 40) * 0.15;
        exhaustPlumeRef.current.scale.x = 1.0 + Math.cos(currentT * 35) * 0.1;
        exhaustPlumeRef.current.visible = true;
      } else {
        exhaustPlumeRef.current.visible = false;
      }
    }

    // Stage 1 separation (booster decouples and falls away backwards)
    if (currentT >= T_MECO && stage1Ref.current) {
      stage1Ref.current.position.y -= delta * 12;
      stage1Ref.current.position.x -= delta * 2;
      stage1Ref.current.rotation.x += delta * 0.3;
    }

    // Stage 2 upper stage ignition
    if (stage2PlumeRef.current) {
      if (currentT >= T_MECO + 0.4 && currentT < T_SECO) {
        stage2PlumeRef.current.scale.y = 1.0 + Math.sin(currentT * 30) * 0.12;
        stage2PlumeRef.current.visible = true;
      } else {
        stage2PlumeRef.current.visible = false;
      }
    }

    // Fairing Jettison (splits laterally to reveal payload in vacuum)
    if (currentT >= T_FAIRING) {
      if (fairingLeftRef.current) {
        fairingLeftRef.current.position.x -= delta * 6;
        fairingLeftRef.current.position.y += delta * 1;
        fairingLeftRef.current.rotation.z += delta * 0.7;
      }
      if (fairingRightRef.current) {
        fairingRightRef.current.position.x += delta * 6;
        fairingRightRef.current.position.y += delta * 1;
        fairingRightRef.current.rotation.z -= delta * 0.7;
      }
    }

    // Spacecraft separation from Stage 2
    if (currentT >= T_SEP && stage2Ref.current) {
      stage2Ref.current.position.y -= delta * 5;
    }

    // Cinematic tracking camera
    const targetX = vehicleRef.current?.position.x ?? 0;
    const targetY = vehicleRef.current?.position.y ?? 0;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX + 4.5, delta * 2.5);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY + 1.2, delta * 3.0);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 7.0 + currentT * 0.3, delta * 1.5);
    camera.lookAt(targetX, targetY, 0);

    // Throttled telemetry state update to DOM (10 Hz)
    if (currentT - lastTelemetryRef.current >= 0.1) {
      lastTelemetryRef.current = currentT;
      onTimeUpdate(currentT);
    }
  });

  return (
    <>
      {/* Deep space starfield */}
      <Stars radius={90} depth={40} count={1800} factor={3} saturation={0} fade speed={0.5} />

      {/* Distant Earth curvature in background */}
      <group position={[0, -210, -50]}>
        <Earth radius={200} showClouds={true} />
      </group>

      {/* Ascent Vehicle Group */}
      <group position={[0, -2, 0]}>
        <group ref={vehicleRef}>
          {/* STAGE 1 BOOSTER */}
          <group ref={stage1Ref} position={[0, -2.5, 0]}>
            {/* Main Booster Cylinder */}
            <mesh castShadow>
              <cylinderGeometry args={[0.6, 0.6, 5.0, 24]} />
              <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.6} />
            </mesh>
            {/* Rocket Engine Nozzles */}
            <mesh position={[0, -2.7, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.45, 0.6, 16, 1, true]} />
              <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.8} />
            </mesh>
            {/* Fiery Exhaust Plume with Core Supersonic Diamond */}
            <group ref={exhaustPlumeRef} position={[0, -3.9, 0]}>
              <mesh rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.65, 2.6, 16]} />
                <meshBasicMaterial color="#FF7700" transparent opacity={0.85} />
              </mesh>
              <mesh rotation={[Math.PI, 0, 0]} position={[0, 0.4, 0]}>
                <coneGeometry args={[0.28, 1.6, 16]} />
                <meshBasicMaterial color="#FFFBEB" transparent opacity={0.95} />
              </mesh>
              {/* Dynamic point light from rocket plume */}
              <pointLight intensity={3.0} color="#FF9900" distance={20} decay={1.5} />
            </group>
          </group>

          {/* Dynamic Launchpad Ground Illumination at Liftoff */}
          {tRef.current < 4.0 && (
            <pointLight
              position={[0, -5, 0]}
              intensity={Math.max(0, (4.0 - tRef.current) * 3.5)}
              color="#FF8C00"
              distance={35}
            />
          )}

          {/* STAGE 2 UPPER STAGE */}
          <group ref={stage2Ref} position={[0, 1.2, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.58, 0.58, 2.2, 24]} />
              <meshStandardMaterial color="#F8FAFC" roughness={0.3} metalness={0.5} />
            </mesh>
            {/* Stage 2 Vacuum Engine Nozzle */}
            <mesh position={[0, -1.3, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.3, 0.45, 16, 1, true]} />
              <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
            </mesh>
            {/* Stage 2 Exhaust Plume */}
            <mesh
              ref={stage2PlumeRef}
              position={[0, -2.0, 0]}
              rotation={[Math.PI, 0, 0]}
              visible={false}
            >
              <coneGeometry args={[0.4, 1.6, 16]} />
              <meshBasicMaterial color="#4FD1FF" transparent opacity={0.75} />
            </mesh>
          </group>

          {/* INNER PAYLOAD SPACECRAFT (Exposed after Fairing Sep) */}
          <group position={[0, 2.6, 0]} scale={[0.45, 0.45, 0.45]}>
            <Spacecraft autoRotate={false} />
          </group>

          {/* PAYLOAD FAIRING HALVES */}
          {/* Left Fairing Half */}
          <mesh
            ref={fairingLeftRef}
            position={[-0.02, 2.8, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.3, 0.62, 2.6, 16, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#F1F5F9" roughness={0.3} metalness={0.4} />
          </mesh>

          {/* Right Fairing Half */}
          <mesh
            ref={fairingRightRef}
            position={[0.02, 2.8, 0]}
            castShadow
          >
            <cylinderGeometry
              args={[0.3, 0.62, 2.6, 16, 1, false, Math.PI, Math.PI]}
            />
            <meshStandardMaterial color="#F1F5F9" roughness={0.3} metalness={0.4} />
          </mesh>
        </group>
      </group>
    </>
  );
};

export interface LaunchProps {
  onComplete: () => void;
  onReturnToDesign?: () => void;
}

/**
 * Complete Launch Experience:
 * Combines 3D R3F Ascent Scene with 2D HTML Telemetry HUD and Outcome Modal.
 */
export const Launch: React.FC<LaunchProps> = ({
  onComplete,
  onReturnToDesign,
}) => {
  const { currentMission, evaluation } = useMissionStore();
  const { unlockStage, setCurrentStage } = useUIStore();

  const [tPlus, setTPlus] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);

  const outcome = evaluation.launchOutcome;

  const handleSkip = () => {
    setTPlus(T_END);
    setIsFinished(true);
  };

  const handleRetry = () => {
    setTPlus(0);
    setIsFinished(false);
    setAttemptKey((k) => k + 1);
  };

  const handleProceedToSimulate = () => {
    unlockStage(5);
    setCurrentStage(5);
    onComplete();
  };

  const handleReturn = () => {
    if (onReturnToDesign) {
      onReturnToDesign();
    } else {
      setCurrentStage(3);
      onComplete();
    }
  };

  // Telemetry ascent calculations
  const targetAltKm = Math.max(
    200,
    Math.round(evaluation.orbit.semiMajorAxisKm * (1 - evaluation.orbit.eccentricity) - 6378.137)
  );
  const currentAltKm = Math.min(
    targetAltKm,
    Math.round(Math.pow(tPlus, 2.2) * 2.8)
  );
  const currentVelKmS = Math.min(
    evaluation.orbit.velocityPerigeeKmS || 7.5,
    Math.round((tPlus / 12) * (evaluation.orbit.velocityPerigeeKmS || 7.5) * 100) / 100
  );

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#05070D]">
      {/* Layer 1: Pure 3D Canvas Scene */}
      <div className="absolute inset-0 w-full h-full">
        <CanvasWrapper className="w-full h-full relative">
          <LaunchVehicle3D
            key={attemptKey}
            isFinished={isFinished}
            onTimeUpdate={(t) => setTPlus(t)}
            onSequenceEnd={() => setIsFinished(true)}
          />
        </CanvasWrapper>
      </div>

      {/* Layer 2: 2D HUD Telemetry Overlay (DOM sibling, never inside Canvas) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-20">
        {/* Top Telemetry Readout */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1 p-3 rounded bg-black/60 backdrop-blur-md border border-space-border text-xs font-mono">
            <span className="font-heading uppercase text-telemetry-amber font-bold text-sm tracking-widest flex items-center gap-1.5">
              <Rocket className="w-4 h-4" />
              <span>Telemetry Ascent Profile</span>
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white font-mono">
                T+ {tPlus.toFixed(1)} s
              </span>
              <Badge variant="amber" size="sm">
                {tPlus < T_MECO
                  ? "BOOSTER BURNOUT"
                  : tPlus < T_FAIRING
                    ? "STAGE 2 ACCELERATION"
                    : tPlus < T_SECO
                      ? "UNENCLOSED FLIGHT"
                      : tPlus < T_SEP
                        ? "ORBITAL INSERTION"
                        : "PAYLOAD SEPARATION"}
              </Badge>
            </div>
          </div>

          <button
            onClick={handleSkip}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded bg-black/60 border border-space-border text-xs font-heading uppercase text-gray-300 hover:text-white hover:border-telemetry-amber transition-all"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Skip Sequence</span>
          </button>
        </div>

        {/* Live Gauges Overlay */}
        <div className="grid grid-cols-2 gap-3 max-w-sm p-3 rounded bg-black/60 backdrop-blur-md border border-space-border font-mono text-xs">
          <div>
            <span className="text-[10px] text-gray-400 block font-heading uppercase tracking-wider">
              Velocity
            </span>
            <span className="text-lg font-bold text-telemetry-cyan">
              {currentVelKmS.toFixed(2)} km/s
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-heading uppercase tracking-wider">
              Altitude
            </span>
            <span className="text-lg font-bold text-telemetry-green">
              {currentAltKm} km
            </span>
          </div>
        </div>
      </div>

      {/* Layer 3: End Result Outcome Modal (DOM sibling) */}
      {isFinished && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-md w-full max-h-[90vh] overflow-y-auto p-6 rounded border border-space-border bg-space-panel shadow-2xl flex flex-col gap-4 text-center my-auto">
            <div className="flex flex-col items-center gap-2">
              {outcome.success ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-telemetry-green/20 border-2 border-telemetry-green flex items-center justify-center shadow-glow-green">
                    <ShieldCheck className="w-8 h-8 text-telemetry-green" />
                  </div>
                  <h2 className="text-2xl font-heading uppercase tracking-widest text-white font-bold">
                    Orbital Insertion Confirmed!
                  </h2>
                  <p className="text-xs font-mono text-gray-300 leading-relaxed">
                    Spacecraft successfully deployed into target {evaluation.orbit.semiMajorAxisKm} km orbit. All deployment telemetry nominal.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-telemetry-red/20 border-2 border-telemetry-red flex items-center justify-center shadow-glow-red">
                    <ShieldAlert className="w-8 h-8 text-telemetry-red" />
                  </div>
                  <h2 className="text-2xl font-heading uppercase tracking-widest text-telemetry-red font-bold">
                    Launch Anomaly Detected
                  </h2>
                  <p className="text-xs font-mono text-gray-300 leading-relaxed">
                    {outcome.failureCause}
                  </p>
                  <Badge variant="alert" size="sm" className="mt-1">
                    {outcome.failureIsDesignDriven ? "DESIGN CONSTRAINT DRIVEN" : "LAUNCH VEHICLE HARDWARE ANOMALY"}
                  </Badge>
                </>
              )}
            </div>

            <div className="p-3 rounded bg-black/40 border border-space-border text-left font-mono text-[11px] text-gray-300 flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Calculated P(Success):</span>
                <span className="text-telemetry-cyan font-bold">
                  {(outcome.probability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Seeded Outcome Roll:</span>
                <span className="text-gray-200">
                  {outcome.roll.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Deterministic Seed:</span>
                <span className="text-telemetry-amber">{currentMission.seed}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 shrink-0">
              <Button
                variant="outline"
                size="md"
                onClick={handleReturn}
                className="flex items-center gap-1.5 flex-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return to Design</span>
              </Button>

              {!outcome.success && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleRetry}
                  className="flex items-center gap-1.5"
                  title="Re-run launch simulation"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </Button>
              )}

              <Button
                variant="primary"
                size="md"
                onClick={handleProceedToSimulate}
                className="flex items-center gap-1.5 flex-1"
              >
                <span>Proceed to Operations</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
