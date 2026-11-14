"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spacecraft } from "./Spacecraft";
import {
  Rocket,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  SkipForward,
} from "lucide-react";

export interface LaunchProps {
  onComplete: () => void;
}

export const LaunchScene: React.FC<LaunchProps> = ({ onComplete }) => {
  const { currentMission, evaluation } = useMissionStore();
  const { unlockStage, setCurrentStage } = useUIStore();

  const [tPlus, setTPlus] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const vehicleRef = useRef<THREE.Group>(null);
  const stage1Ref = useRef<THREE.Group>(null);
  const stage2Ref = useRef<THREE.Group>(null);
  const fairingLeftRef = useRef<THREE.Mesh>(null);
  const fairingRightRef = useRef<THREE.Mesh>(null);
  const exhaustPlumeRef = useRef<THREE.Mesh>(null);

  const outcome = evaluation.launchOutcome;

  // Staging event thresholds in seconds (scaled 12-14s sequence)
  const T_MECO = 4.0;
  const T_FAIRING = 6.5;
  const T_SECO = 9.5;
  const T_SEP = 11.5;
  const T_END = 13.5;

  // Animation frame loop
  useFrame((_, delta) => {
    if (isFinished) return;

    const newT = tPlus + delta;
    setTPlus(newT);

    if (newT >= T_END) {
      setIsFinished(true);
      return;
    }

    // Ascent altitude progression
    if (vehicleRef.current) {
      const altitude = Math.pow(newT, 1.9) * 1.5;
      vehicleRef.current.position.y = altitude;
      // Slight pitchover gravity turn
      const pitch = Math.min(0.85, (newT / T_END) * 0.9);
      vehicleRef.current.rotation.z = -pitch;
    }

    // Exhaust plume flicker
    if (exhaustPlumeRef.current) {
      if (newT < T_MECO || (newT > T_MECO + 0.5 && newT < T_SECO)) {
        exhaustPlumeRef.current.scale.y = 1.0 + Math.sin(newT * 40) * 0.15;
        exhaustPlumeRef.current.scale.x = 1.0 + Math.cos(newT * 35) * 0.1;
        exhaustPlumeRef.current.visible = true;
      } else {
        exhaustPlumeRef.current.visible = false;
      }
    }

    // Stage 1 Separation (falls away backward)
    if (newT >= T_MECO && stage1Ref.current) {
      stage1Ref.current.position.y -= delta * 12;
      stage1Ref.current.rotation.x += delta * 0.3;
    }

    // Fairing Jettison (splits laterally)
    if (newT >= T_FAIRING) {
      if (fairingLeftRef.current) {
        fairingLeftRef.current.position.x -= delta * 6;
        fairingLeftRef.current.rotation.z += delta * 0.8;
      }
      if (fairingRightRef.current) {
        fairingRightRef.current.position.x += delta * 6;
        fairingRightRef.current.rotation.z -= delta * 0.8;
      }
    }

    // Spacecraft separation from stage 2
    if (newT >= T_SEP && stage2Ref.current) {
      stage2Ref.current.position.y -= delta * 4;
    }
  });

  const handleSkip = () => {
    setIsFinished(true);
  };

  const handleProceedToSimulate = () => {
    unlockStage(5);
    setCurrentStage(5);
    onComplete();
  };

  const handleReturnToDesign = () => {
    setCurrentStage(3);
    onComplete();
  };

  // Telemetry values during climb
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
    <>
      {/* 3D Scene Group */}
      <group position={[0, -2, 0]}>
        <group ref={vehicleRef}>
          {/* STAGE 1 BOOSTER */}
          <group ref={stage1Ref} position={[0, -2.5, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.6, 0.6, 5.0, 24]} />
              <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.6} />
            </mesh>
            {/* Rocket Engine Nozzles */}
            <mesh position={[0, -2.7, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.45, 0.6, 16, 1, true]} />
              <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.8} />
            </mesh>
            {/* Fiery Exhaust Plume */}
            <mesh
              ref={exhaustPlumeRef}
              position={[0, -3.8, 0]}
              rotation={[Math.PI, 0, 0]}
            >
              <coneGeometry args={[0.55, 2.4, 16]} />
              <meshBasicMaterial color="#FFB000" transparent opacity={0.85} />
            </mesh>
          </group>

          {/* STAGE 2 UPPER STAGE */}
          <group ref={stage2Ref} position={[0, 1.2, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.58, 0.58, 2.2, 24]} />
              <meshStandardMaterial color="#F8FAFC" roughness={0.3} metalness={0.5} />
            </mesh>
          </group>

          {/* INNER PAYLOAD SPACECRAFT (Enclosed in Fairing) */}
          <group position={[0, 2.6, 0]} scale={[0.5, 0.5, 0.5]}>
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

      {/* 2D HUD Telemetry Overlay During Launch Sequence */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-20">
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
                      : "ORBITAL INSERTION"}
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

      {/* End Result Modal / Overlay */}
      {isFinished && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-md w-full p-6 rounded border border-space-border bg-space-panel shadow-2xl flex flex-col gap-4 text-center">
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

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={handleReturnToDesign}
                className="flex items-center gap-1.5 flex-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return to Design</span>
              </Button>

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
    </>
  );
};

export const Launch = LaunchScene;

