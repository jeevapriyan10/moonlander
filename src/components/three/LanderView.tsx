"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { CanvasWrapper } from "./CanvasWrapper";
import {
  type LanderConfig,
  type LanderState,
  type LanderInput,
  type LandingSite,
  type TerrainMap,
  type TouchdownReport,
  type ReplayLog,
  type ReplayFrame,
  type AssistLevel,
  TIMESTEP_S,
  generateTerrain,
  initializeLanderState,
  computeAutopilotInput,
  computeAssistedInput,
  stepLanderPhysics,
  evaluateTouchdown,
  deriveLanderConfig,
  replayDescent,
} from "@/engine/lander";
import { landingSites } from "@/data";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Rocket,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Play,
  Pause,
  ChevronRight,
  Flame,
  Radio,
  Gauge,
  Compass,
  Crosshair,
  Volume2,
  Tv,
  Gamepad2,
  CheckCircle2,
  Sparkles,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Sliders,
} from "lucide-react";

type CameraMode = "chase" | "surface" | "cockpit";

interface Lander3DProps {
  state: LanderState;
  terrain: TerrainMap;
  config: LanderConfig;
  site: LandingSite;
  cameraMode: CameraMode;
}

/**
 * 3D Scene Components for Lunar/Martian Descent
 */
const LanderScene3D: React.FC<Lander3DProps> = ({
  state,
  terrain,
  config,
  site,
  cameraMode,
}) => {
  const { camera } = useThree();
  const vehicleGroupRef = useRef<THREE.Group>(null);
  const flameMeshRef = useRef<THREE.Mesh>(null);
  const rcsLeftRef = useRef<THREE.Mesh>(null);
  const rcsRightRef = useRef<THREE.Mesh>(null);
  const dustGroupRef = useRef<THREE.Group>(null);
  const parachuteMeshRef = useRef<THREE.Group>(null);

  // Procedural terrain geometry derived directly from deterministic terrain.getHeight(x)
  const terrainGeo = useMemo(() => {
    const width = 6000;
    const depth = 800;
    const segsX = 240;
    const segsZ = 32;
    const geo = new THREE.PlaneGeometry(width, depth, segsX, segsZ);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        // Base elevation from analytical terrain function + subtle high-frequency lateral noise
        const baseY = terrain.getHeight(x);
        const lateralNoise = Math.sin(x * 0.05 + z * 0.08) * 0.8 + Math.cos(z * 0.04) * 0.6;
        pos.setY(i, baseY + lateralNoise);
      }
      geo.computeVertexNormals();
    }
    return geo;
  }, [terrain]);

  // Dynamic frame loop updating vehicle pose, exhaust flame, dust kick-up, and camera tracking
  useFrame((_, delta) => {
    if (!vehicleGroupRef.current) return;

    // 1. Vehicle position and attitude
    vehicleGroupRef.current.position.set(state.x, state.y, 0);
    vehicleGroupRef.current.rotation.z = -state.pitchRad;

    // 2. Engine exhaust flame scaling and flicker
    if (flameMeshRef.current) {
      if (state.throttle > 0.01 && !state.fuelExhausted && !state.isLanded && !state.isCrashed) {
        flameMeshRef.current.visible = true;
        const flicker = 0.88 + Math.random() * 0.24;
        const scale = (state.throttle * 2.8 + 0.4) * flicker;
        flameMeshRef.current.scale.set(1.0, scale, 1.0);
      } else {
        flameMeshRef.current.visible = false;
      }
    }

    // 3. RCS cold-gas puffs
    if (rcsLeftRef.current && rcsRightRef.current) {
      rcsLeftRef.current.visible = state.pitchRateRadS < -0.05;
      rcsRightRef.current.visible = state.pitchRateRadS > 0.05;
    }

    // 4. Ground dust kick-up effect near surface
    if (dustGroupRef.current) {
      const groundY = terrain.getHeight(state.x);
      dustGroupRef.current.position.set(state.x, groundY + 0.2, 0);
      if (state.altitudeAGL < 35.0 && state.throttle > 0.05 && !state.isLanded) {
        dustGroupRef.current.visible = true;
        const intensity = (1.0 - state.altitudeAGL / 35.0) * state.throttle;
        dustGroupRef.current.scale.set(
          1.0 + intensity * 4.5,
          0.8 + intensity * 2.2,
          1.0 + intensity * 4.5
        );
        dustGroupRef.current.rotation.y += delta * 1.5;
      } else {
        dustGroupRef.current.visible = false;
      }
    }

    // 5. Parachute canopy for Mars variant
    if (parachuteMeshRef.current) {
      parachuteMeshRef.current.visible = state.parachuteDeployed && !state.isLanded;
    }

    // 6. Camera tracking modes
    if (cameraMode === "chase") {
      const targetCamX = state.x - Math.sin(state.pitchRad * 0.4) * 8 - 18;
      const targetCamY = state.y + 7.5;
      const targetCamZ = 28;
      camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.12);
      camera.lookAt(state.x + 3.0, state.y + 1.0, 0);
    } else if (cameraMode === "surface") {
      // Ground-level observation post looking up at descent corridor
      const groundObsX = site.safeZoneX + 45;
      const groundObsY = terrain.getHeight(groundObsX) + 2.5;
      camera.position.lerp(new THREE.Vector3(groundObsX, groundObsY, 35), 0.08);
      camera.lookAt(state.x, state.y, 0);
    } else if (cameraMode === "cockpit") {
      // Downward landing camera pointing through bottom heat shield
      camera.position.set(state.x, state.y - 0.5, 0);
      camera.lookAt(state.x, state.y - 100, 0);
    }
  });

  return (
    <>
      <color attach="background" args={["#02040a"]} />
      <Stars radius={200} depth={80} count={3500} factor={4} saturation={0} fade speed={0.5} />

      {/* Low-sun directional lighting for dramatic long shadows */}
      <ambientLight intensity={config.body === "mars" ? 0.35 : 0.12} />
      <directionalLight
        position={[-1800, 450, 600]}
        intensity={config.body === "mars" ? 1.6 : 2.2}
        color={config.body === "mars" ? "#ffddba" : "#f5f6ff"}
        castShadow
      />

      {/* Terrain 3D Mesh */}
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial
          color={config.body === "mars" ? "#a85232" : "#5a5d64"}
          roughness={0.92}
          metalness={0.08}
          flatShading={false}
        />
      </mesh>

      {/* Safe Landing Zone Circular Plateau Marker */}
      <group position={[terrain.safeZoneX, terrain.getHeight(terrain.safeZoneX) + 0.15, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[terrain.safeRadiusM * 0.95, terrain.safeRadiusM, 48]} />
          <meshBasicMaterial color="#00ffcc" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.5, 24]} />
          <meshBasicMaterial color="#00ffcc" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Science Target Marker */}
      <group position={[terrain.scienceTargetX, terrain.getHeight(terrain.scienceTargetX) + 0.15, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.0, 3.6, 24]} />
          <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 4, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 8, 8]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Boulders & Hazards */}
      {terrain.hazards.map((hazard, idx) => (
        <mesh
          key={idx}
          position={[hazard.x, terrain.getHeight(hazard.x) + hazard.heightM * 0.45, (idx % 5 - 2) * 12]}
          castShadow
        >
          <dodecahedronGeometry args={[hazard.radiusM, 1]} />
          <meshStandardMaterial
            color={config.body === "mars" ? "#7c3722" : "#3b3e44"}
            roughness={0.95}
          />
        </mesh>
      ))}

      {/* Ground Dust Kick-up Swirl */}
      <group ref={dustGroupRef} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 5.5, 32]} />
          <meshBasicMaterial
            color={config.body === "mars" ? "#c87d55" : "#a6abb3"}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 3D Lander Spacecraft Model */}
      <group ref={vehicleGroupRef}>
        {/* Octagonal Lander Body with Gold Foil MLI */}
        <mesh castShadow position={[0, 1.2, 0]}>
          <cylinderGeometry args={[1.5, 1.8, 1.8, 8]} />
          <meshStandardMaterial
            color="#e5a93c"
            metalness={0.85}
            roughness={0.25}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Upper Avionics & Instrument Deck */}
        <mesh castShadow position={[0, 2.3, 0]}>
          <cylinderGeometry args={[1.2, 1.4, 0.6, 8]} />
          <meshStandardMaterial color="#333742" metalness={0.5} roughness={0.4} />
        </mesh>

        {/* High-Gain Antenna Dish */}
        <group position={[0.7, 2.7, 0.5]} rotation={[0.3, 0.5, 0.2]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
            <meshStandardMaterial color="#888" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.45, 0.15, 16, 1, true]} />
            <meshStandardMaterial color="#e0e0e0" side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Main Descent Engine Bell */}
        <mesh position={[0, 0.1, 0]}>
          <coneGeometry args={[0.55, 0.9, 16, 1, true]} />
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>

        {/* Dynamic Exhaust Flame Cone */}
        <mesh ref={flameMeshRef} position={[0, -0.9, 0]} visible={false}>
          <coneGeometry args={[0.45, 1.6, 16]} />
          <meshBasicMaterial color="#55ccff" transparent opacity={0.85} />
        </mesh>

        {/* Cold Gas RCS Thruster Puffs */}
        <mesh ref={rcsLeftRef} position={[-1.7, 1.4, 0]} visible={false}>
          <coneGeometry args={[0.2, 0.8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
        </mesh>
        <mesh ref={rcsRightRef} position={[1.7, 1.4, 0]} visible={false}>
          <coneGeometry args={[0.2, 0.8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
        </mesh>

        {/* Four Outrigger Landing Gear Legs */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => {
          const legRadius = config.legSpanM * 0.48;
          const lx = Math.cos(angle) * legRadius;
          const lz = Math.sin(angle) * legRadius;
          return (
            <group key={idx}>
              {/* Primary Strut */}
              <line>
                <bufferGeometry
                  attach="geometry"
                  onUpdate={(self) => {
                    self.setFromPoints([
                      new THREE.Vector3(lx * 0.3, 0.8, lz * 0.3),
                      new THREE.Vector3(lx, -0.1, lz),
                    ]);
                  }}
                />
                <lineBasicMaterial attach="material" color="#94a3b8" linewidth={3} />
              </line>
              {/* Footpad */}
              <mesh position={[lx, -0.15, lz]}>
                <cylinderGeometry args={[0.3, 0.3, 0.08, 12]} />
                <meshStandardMaterial color="#64748b" metalness={0.7} />
              </mesh>
            </group>
          );
        })}

        {/* Mars Parachute Canopy Assembly */}
        <group ref={parachuteMeshRef} position={[0, 9.0, 0]} visible={false}>
          <mesh rotation={[Math.PI, 0, 0]}>
            <sphereGeometry args={[4.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#f97316" side={THREE.DoubleSide} />
          </mesh>
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={(self) => {
                self.setFromPoints([
                  new THREE.Vector3(0, 0, 0),
                  new THREE.Vector3(0, -6.5, 0),
                ]);
              }}
            />
            <lineBasicMaterial color="#ffffff" />
          </line>
        </group>
      </group>
    </>
  );
};

export interface LanderViewProps {
  onComplete?: (report: TouchdownReport) => void;
  onExit?: () => void;
}

/**
 * Main MoonLander Powered Descent Experience
 */
export const LanderView: React.FC<LanderViewProps> = ({ onComplete, onExit }) => {
  const { currentMission, evaluation } = useMissionStore();
  const { setCurrentStage, unlockStage } = useUIStore();

  // Selected landing site (defaults to Artemis Shackleton or Apollo 11)
  const [selectedSiteId, setSelectedSiteId] = useState<string>(() => {
    if (currentMission.orbitId === "lunar-surface") {
      return "artemis-shackleton";
    }
    return "apollo-11";
  });

  const selectedSite = useMemo(() => {
    return (
      landingSites.find((s) => s.id === selectedSiteId) ??
      landingSites[0]!
    );
  }, [selectedSiteId]);

  // Assist Mode: Autopilot (Autonomous), Assisted (Attitude hold + Hover assist), Manual (Direct)
  const [assistLevel, setAssistLevel] = useState<AssistLevel>("assisted");
  const [cameraMode, setCameraMode] = useState<CameraMode>("chase");

  // Derive lander physical configuration from player's spacecraft design
  const { config: landerConfig } = useMemo(() => {
    const isMars = selectedSite.body === "mars";
    return deriveLanderConfig(
      currentMission.busId,
      currentMission.propulsionId,
      currentMission.adcsId,
      currentMission.selectedInstrumentIds,
      evaluation.mass?.totalDryMassKg ?? 650,
      currentMission.propellantMassKg ?? 950,
      isMars ? "mars" : "moon"
    );
  }, [currentMission, evaluation, selectedSite.body]);

  // Analytical terrain map
  const terrain = useMemo(() => {
    return generateTerrain("moonlander-run-" + selectedSite.id, {
      ...selectedSite,
      safeZoneX: 0,
      scienceTargetX: selectedSite.scienceTargetOffsetM ?? 100,
    });
  }, [selectedSite]);

  // Simulation State
  const [landerState, setLanderState] = useState<LanderState>(() =>
    initializeLanderState(landerConfig, currentMission.propellantMassKg ?? 950)
  );

  // User input controls state
  const inputRef = useRef<LanderInput>({
    throttle: 0.0,
    steer: 0.0,
    cutThrust: false,
    deployParachute: false,
  });

  const [uiThrottle, setUiThrottle] = useState<number>(0.0);
  const [touchdownReport, setTouchdownReport] = useState<TouchdownReport | null>(null);

  // Keyframe recorder for deterministic instant replay
  const replayLogRef = useRef<ReplayFrame[]>([]);
  const isReplayingRef = useRef<boolean>(false);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1.0);
  const [replayProgress, setReplayProgress] = useState<number>(0);

  // Gamepad connection state
  const [gamepadConnected, setGamepadConnected] = useState<boolean>(false);

  // Reset simulation to High Gate
  const handleResetDescent = useCallback(() => {
    const freshState = initializeLanderState(
      landerConfig,
      currentMission.propellantMassKg ?? 950
    );
    setLanderState(freshState);
    setTouchdownReport(null);
    setIsReplaying(false);
    isReplayingRef.current = false;
    replayLogRef.current = [];
    inputRef.current = { throttle: 0.0, steer: 0.0 };
    setUiThrottle(0.0);
  }, [landerConfig, currentMission.propellantMassKg]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (touchdownReport || isReplayingRef.current) return;

      if (e.code === "ArrowUp" || e.code === "KeyW") {
        inputRef.current.throttle = Math.min(1.0, inputRef.current.throttle + 0.08);
        setUiThrottle(inputRef.current.throttle);
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        inputRef.current.throttle = Math.max(0.0, inputRef.current.throttle - 0.08);
        setUiThrottle(inputRef.current.throttle);
      } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
        inputRef.current.steer = -1.0;
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        inputRef.current.steer = 1.0;
      } else if (e.code === "Space") {
        inputRef.current.throttle = 1.0;
        setUiThrottle(1.0);
      } else if (e.code === "KeyX") {
        inputRef.current.cutThrust = true;
        inputRef.current.throttle = 0.0;
        setUiThrottle(0.0);
      } else if (e.code === "KeyP") {
        inputRef.current.deployParachute = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA" || e.code === "ArrowRight" || e.code === "KeyD") {
        inputRef.current.steer = 0.0;
      } else if (e.code === "KeyX") {
        inputRef.current.cutThrust = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [touchdownReport]);

  // Gamepad API polling listener
  useEffect(() => {
    const onGamepadConnected = () => setGamepadConnected(true);
    const onGamepadDisconnected = () => setGamepadConnected(false);

    window.addEventListener("gamepadconnected", onGamepadConnected);
    window.addEventListener("gamepaddisconnected", onGamepadDisconnected);

    return () => {
      window.removeEventListener("gamepadconnected", onGamepadConnected);
      window.removeEventListener("gamepaddisconnected", onGamepadDisconnected);
    };
  }, []);

  // 120 Hz Fixed Timestep Simulation Loop with Sub-stepping
  useEffect(() => {
    let animFrame: number;
    let lastTime = performance.now();
    let accumulator = 0.0;

    const loop = (currentTime: number) => {
      const deltaSec = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      if (!isReplayingRef.current) {
        accumulator += deltaSec;

        // Poll Gamepad API if available
        if (typeof navigator !== "undefined" && navigator.getGamepads) {
          const gamepads = navigator.getGamepads();
          const gp = gamepads[0];
          if (gp) {
            // Left stick X for steer (-1 to 1)
            if (Math.abs(gp.axes[0] ?? 0) > 0.15) {
              inputRef.current.steer = gp.axes[0] ?? 0;
            }
            // Right trigger (button 7) or right stick Y for throttle
            const trigger = gp.buttons[7]?.value ?? 0;
            if (trigger > 0.05) {
              inputRef.current.throttle = trigger;
              setUiThrottle(trigger);
            }
          }
        }

        // Run fixed-step sub-steps
        while (accumulator >= TIMESTEP_S) {
          accumulator -= TIMESTEP_S;

          setLanderState((prevState) => {
            if (prevState.isLanded || prevState.isCrashed) {
              return prevState;
            }

            // Determine active control input based on Assist Level
            let activeInput: LanderInput = { ...inputRef.current };

            if (assistLevel === "autopilot") {
              activeInput = computeAutopilotInput(prevState, landerConfig, terrain);
              setUiThrottle(activeInput.throttle);
            } else if (assistLevel === "assisted") {
              activeInput = computeAssistedInput(activeInput, prevState, landerConfig);
            }

            // Log keyframe for deterministic replay
            const frameIndex = Math.round(prevState.t * 120);
            replayLogRef.current.push({
              frame: frameIndex,
              throttle: activeInput.throttle,
              steer: activeInput.steer,
              flags:
                (activeInput.cutThrust ? 1 : 0) |
                (activeInput.deployParachute ? 2 : 0),
            });

            // Advance 120 Hz physics step
            const nextState = stepLanderPhysics(
              prevState,
              activeInput,
              landerConfig,
              terrain,
              TIMESTEP_S
            );

            // Handle touchdown event
            if ((nextState.isLanded || nextState.isCrashed) && !touchdownReport) {
              const rep = evaluateTouchdown(nextState, landerConfig, terrain);
              setTouchdownReport(rep);
              if (onComplete) onComplete(rep);
            }

            return nextState;
          });
        }
      }

      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [assistLevel, landerConfig, terrain, touchdownReport, onComplete]);

  // Deterministic Instant Replay Runner
  const handleStartReplay = () => {
    if (replayLogRef.current.length === 0) return;
    setIsReplaying(true);
    isReplayingRef.current = true;

    const log: ReplayLog = {
      version: 1,
      seed: "moonlander-run-" + selectedSite.id,
      siteId: selectedSite.id,
      body: selectedSite.body,
      config: landerConfig,
      assist: assistLevel,
      frames: replayLogRef.current,
    };

    const replayRun = replayDescent(log, terrain);
    let replayIdx = 0;

    const replayInterval = setInterval(() => {
      if (replayIdx >= replayRun.states.length) {
        clearInterval(replayInterval);
        setIsReplaying(false);
        isReplayingRef.current = false;
        return;
      }
      const st = replayRun.states[replayIdx]!;
      setLanderState(st);
      setReplayProgress(replayIdx / replayRun.states.length);
      replayIdx += Math.round(replaySpeed * 2);
    }, 16);
  };

  const isLowFuel = landerState.propellantKg < 25.0;
  const sinkRateAlert = Math.abs(landerState.vy) > landerConfig.maxVerticalSpeedMS;

  return (
    <div className="relative w-full h-full min-h-[620px] bg-space-bg flex flex-col overflow-hidden select-none">
      {/* 3D WebGL Canvas Layer */}
      <div className="absolute inset-0">
        <CanvasWrapper className="w-full h-full">
          <LanderScene3D
            state={landerState}
            terrain={terrain}
            config={landerConfig}
            site={{
              ...selectedSite,
              safeZoneX: 0,
              scienceTargetX: selectedSite.scienceTargetOffsetM ?? 100,
            }}
            cameraMode={cameraMode}
          />
        </CanvasWrapper>
      </div>

      {/* Top Cockpit Header Bar */}
      <div className="relative z-10 flex items-center justify-between gap-4 p-4 bg-gradient-to-b from-space-bg/90 via-space-bg/60 to-transparent pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-telemetry-green animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading tracking-widest text-white text-sm font-bold uppercase">
                {selectedSite.name}
              </span>
              <Badge variant="info" size="sm">
                {selectedSite.body === "mars" ? "3.71 M/S² MARS G" : "1.62 M/S² LUNAR G"}
              </Badge>
            </div>
            <div className="font-mono text-xs text-slate-400">
              MET: T+ {landerState.t.toFixed(1)}s &bull; LAT {selectedSite.latDeg.toFixed(2)}° LON {selectedSite.lonDeg.toFixed(2)}°
            </div>
          </div>
        </div>

        {/* Assist Level Mode Selector */}
        <div className="flex items-center gap-2 bg-space-panel/90 border border-space-border px-3 py-1.5 rounded-lg">
          <Sliders className="w-3.5 h-3.5 text-telemetry-amber" />
          <span className="font-mono text-xs text-slate-400 uppercase hidden md:inline">Mode:</span>
          {(["autopilot", "assisted", "manual"] as AssistLevel[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setAssistLevel(mode)}
              className={`px-2 py-1 font-mono text-[11px] uppercase rounded transition-colors ${
                assistLevel === mode
                  ? "bg-telemetry-amber text-space-bg font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Camera Perspective Mode */}
        <div className="flex items-center gap-1.5 bg-space-panel/90 border border-space-border px-2.5 py-1.5 rounded-lg">
          <Tv className="w-3.5 h-3.5 text-sky-400" />
          {(["chase", "surface", "cockpit"] as CameraMode[]).map((cam) => (
            <button
              key={cam}
              onClick={() => setCameraMode(cam)}
              className={`px-2 py-0.5 font-mono text-[11px] uppercase rounded ${
                cameraMode === cam
                  ? "bg-sky-500 text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {cam}
            </button>
          ))}
        </div>
      </div>

      {/* Main HUD Overlays: Left Tape, Center Horizon, Right Tape */}
      <div className="relative z-10 flex-1 flex justify-between p-4 pointer-events-none">
        {/* Left Telemetry Gauges: Altitude, Sink Rate, Lateral Drift */}
        <div className="flex flex-col gap-3 w-48 pointer-events-auto">
          {/* Radar Altitude AGL */}
          <div className="p-3 rounded-lg bg-space-panel/85 border border-space-border backdrop-blur">
            <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Radar Altitude</span>
              <Gauge className="w-3 h-3 text-telemetry-cyan" />
            </div>
            <div className="font-mono text-2xl font-bold text-white mt-0.5">
              {landerState.altitudeAGL.toFixed(1)} <span className="text-xs text-slate-400">m</span>
            </div>
            <div className="w-full bg-space-border h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-telemetry-cyan h-full transition-all"
                style={{ width: `${Math.min(100, (landerState.altitudeAGL / 2000) * 100)}%` }}
              />
            </div>
          </div>

          {/* Vertical Sink Rate */}
          <div
            className={`p-3 rounded-lg border backdrop-blur transition-colors ${
              sinkRateAlert
                ? "bg-alert-red/20 border-alert-red animate-pulse"
                : "bg-space-panel/85 border-space-border"
            }`}
          >
            <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Sink Rate (Vy)</span>
              {sinkRateAlert ? (
                <ShieldAlert className="w-3.5 h-3.5 text-alert-red" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div
              className={`font-mono text-2xl font-bold mt-0.5 ${
                sinkRateAlert ? "text-alert-red" : "text-white"
              }`}
            >
              {Math.abs(landerState.vy).toFixed(2)} <span className="text-xs text-slate-400">m/s</span>
            </div>
            <div className="font-mono text-[10px] text-slate-400 mt-1">
              Limit: &le; {landerConfig.maxVerticalSpeedMS.toFixed(1)} m/s
            </div>
          </div>

          {/* Horizontal Drift Velocity */}
          <div className="p-3 rounded-lg bg-space-panel/85 border border-space-border backdrop-blur">
            <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Lateral Drift (Vx)</span>
              <Compass className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-mono text-xl font-bold text-white mt-0.5">
              {landerState.vx.toFixed(2)} <span className="text-xs text-slate-400">m/s</span>
            </div>
            <div className="font-mono text-[10px] text-slate-400 mt-1">
              Downrange: {landerState.x.toFixed(0)} m
            </div>
          </div>
        </div>

        {/* Center Reticle: Artificial Horizon & Tilt Indicator */}
        <div className="flex flex-col items-center justify-start pointer-events-none mt-4">
          <div className="relative w-40 h-40 border border-telemetry-green/40 rounded-full flex items-center justify-center">
            {/* Horizon Crosshairs */}
            <div className="absolute w-full h-[1px] bg-telemetry-green/30" />
            <div className="absolute h-full w-[1px] bg-telemetry-green/30" />

            {/* Spacecraft Attitude Indicator Bar */}
            <div
              className="absolute w-24 h-0.5 bg-telemetry-amber transition-transform duration-75"
              style={{
                transform: `rotate(${-(landerState.pitchRad * 180) / Math.PI}deg)`,
              }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-telemetry-amber rounded-full" />
            </div>

            {/* Digital Tilt Readout */}
            <div className="absolute bottom-2 font-mono text-[11px] font-bold text-white bg-space-bg/80 px-2 py-0.5 rounded border border-space-border">
              {((landerState.pitchRad * 180) / Math.PI).toFixed(1)}°
            </div>
          </div>

          <div className="font-mono text-[10px] text-slate-400 tracking-wider uppercase mt-2">
            Tip-Over Threshold: &plusmn;{((landerConfig.tipOverAngleRad * 180) / Math.PI).toFixed(0)}°
          </div>
        </div>

        {/* Right Telemetry Gauges: Propellant, Thrust & Mars Parachute */}
        <div className="flex flex-col gap-3 w-48 pointer-events-auto">
          {/* Propellant Tank */}
          <div
            className={`p-3 rounded-lg border backdrop-blur transition-colors ${
              isLowFuel
                ? "bg-alert-red/20 border-alert-red animate-pulse"
                : "bg-space-panel/85 border-space-border"
            }`}
          >
            <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Propellant</span>
              <Flame className="w-3.5 h-3.5 text-telemetry-amber" />
            </div>
            <div className="font-mono text-2xl font-bold text-white mt-0.5">
              {landerState.propellantKg.toFixed(1)} <span className="text-xs text-slate-400">kg</span>
            </div>
            <div className="w-full bg-space-border h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full transition-all ${isLowFuel ? "bg-alert-red" : "bg-telemetry-amber"}`}
                style={{
                  width: `${Math.min(
                    100,
                    (landerState.propellantKg / landerConfig.propellantMassKg) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Engine Thrust Readout */}
          <div className="p-3 rounded-lg bg-space-panel/85 border border-space-border backdrop-blur">
            <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Thrust Output</span>
              <Rocket className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="font-mono text-xl font-bold text-white mt-0.5">
              {(landerState.thrustN / 1000).toFixed(2)} <span className="text-xs text-slate-400">kN</span>
            </div>
            <div className="font-mono text-xs text-telemetry-cyan mt-1">
              Throttle: {(landerState.throttle * 100).toFixed(0)}%
            </div>
          </div>

          {/* Mars Parachute Trigger (active only for Mars scenario) */}
          {selectedSite.body === "mars" && (
            <button
              onClick={() => {
                inputRef.current.deployParachute = true;
              }}
              disabled={landerState.parachuteDeployed}
              className={`p-2.5 rounded-lg border font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                landerState.parachuteDeployed
                  ? "bg-telemetry-green/20 border-telemetry-green text-telemetry-green cursor-default"
                  : "bg-amber-500/20 border-amber-500 hover:bg-amber-500/30 text-amber-300"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {landerState.parachuteDeployed ? "Chute Deployed" : "Deploy Parachute"}
            </button>
          )}

          {/* Gamepad Connection Badge */}
          {gamepadConnected && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-space-panel/80 border border-space-border font-mono text-[10px] text-slate-300">
              <Gamepad2 className="w-3 h-3 text-telemetry-green" />
              <span>Gamepad Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Mission Control Annunciator & Onscreen Touch Controls */}
      <div className="relative z-10 p-4 bg-gradient-to-t from-space-bg/95 via-space-bg/80 to-transparent flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto">
        {/* CAPCOM Live Audio/Text Annunciator */}
        <div className="flex items-center gap-3 bg-space-panel/90 border border-space-border px-4 py-2.5 rounded-lg max-w-xl w-full">
          <Volume2 className="w-4 h-4 text-telemetry-amber shrink-0 animate-pulse" />
          <div className="font-mono text-xs text-telemetry-amber tracking-wide truncate">
            {landerState.callout ?? "DESCENT RADAR ACQUISITION NOMINAL."}
          </div>
        </div>

        {/* Onscreen Manual Controls (Touch & Quick-Click) */}
        <div className="flex items-center gap-4">
          {/* Tilt Steer Left / Right */}
          <div className="flex items-center gap-1 bg-space-panel/90 border border-space-border p-1 rounded-lg">
            <button
              onMouseDown={() => {
                inputRef.current.steer = -1.0;
              }}
              onMouseUp={() => {
                inputRef.current.steer = 0.0;
              }}
              onTouchStart={() => {
                inputRef.current.steer = -1.0;
              }}
              onTouchEnd={() => {
                inputRef.current.steer = 0.0;
              }}
              className="p-2 hover:bg-space-border rounded text-slate-300 hover:text-white"
              title="Steer Left (A / Left Arrow)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-[10px] text-slate-400 px-1">RCS</span>
            <button
              onMouseDown={() => {
                inputRef.current.steer = 1.0;
              }}
              onMouseUp={() => {
                inputRef.current.steer = 0.0;
              }}
              onTouchStart={() => {
                inputRef.current.steer = 1.0;
              }}
              onTouchEnd={() => {
                inputRef.current.steer = 0.0;
              }}
              className="p-2 hover:bg-space-border rounded text-slate-300 hover:text-white"
              title="Steer Right (D / Right Arrow)"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Throttle Slider */}
          <div className="flex items-center gap-2 bg-space-panel/90 border border-space-border px-3 py-1.5 rounded-lg">
            <span className="font-mono text-[10px] text-slate-400">THR:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={uiThrottle}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setUiThrottle(val);
                inputRef.current.throttle = val;
              }}
              className="w-28 accent-telemetry-amber cursor-pointer"
            />
            <span className="font-mono text-xs text-white w-9 text-right font-bold">
              {(uiThrottle * 100).toFixed(0)}%
            </span>
          </div>

          {/* Engine Cutoff (Emergency Cut) */}
          <button
            onClick={() => {
              inputRef.current.throttle = 0;
              setUiThrottle(0);
              inputRef.current.cutThrust = true;
              setTimeout(() => {
                inputRef.current.cutThrust = false;
              }, 200);
            }}
            className="px-3 py-2 bg-alert-red/20 border border-alert-red hover:bg-alert-red/30 text-alert-red font-mono text-xs uppercase font-bold rounded-lg transition-colors"
          >
            CUT (X)
          </button>

          {/* Reset / Abort */}
          <button
            onClick={handleResetDescent}
            className="p-2 bg-space-panel border border-space-border hover:bg-space-border text-slate-300 hover:text-white rounded-lg transition-colors"
            title="Restart Descent from High Gate"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Touchdown & Flight Evaluation Modal */}
      {touchdownReport && (
        <div className="absolute inset-0 z-50 bg-space-bg/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="max-w-xl w-full bg-space-panel border border-space-border rounded-xl p-6 shadow-2xl flex flex-col gap-4">
            {/* Header / Outcome Banner */}
            <div className="flex items-center justify-between border-b border-space-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      touchdownReport.tier === "perfect" || touchdownReport.tier === "safe"
                        ? "nominal"
                        : touchdownReport.tier === "hard"
                        ? "warning"
                        : "alert"
                    }
                    size="md"
                  >
                    {touchdownReport.tier.toUpperCase()} TOUCHDOWN
                  </Badge>
                  <div className="flex items-center gap-1 text-telemetry-amber">
                    {[1, 2, 3].map((star) => (
                      <Sparkles
                        key={star}
                        className={`w-4 h-4 ${
                          star <= touchdownReport.stars ? "fill-telemetry-amber" : "opacity-30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <h2 className="text-2xl font-heading uppercase tracking-wider text-white font-bold mt-1">
                  Flight Telemetry Debrief
                </h2>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs text-slate-400">Score</span>
                <div className="font-mono text-2xl font-bold text-telemetry-cyan">
                  {touchdownReport.score} <span className="text-xs text-slate-400">/ 1000</span>
                </div>
              </div>
            </div>

            {/* Assessment Narrative */}
            <div className="p-3 rounded-lg bg-space-bg/80 border border-space-border font-mono text-xs text-slate-300 leading-relaxed">
              {touchdownReport.reason}
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded bg-space-bg border border-space-border text-center">
                <span className="font-mono text-[10px] text-slate-400 uppercase">Touchdown Vy</span>
                <div className="font-mono text-base font-bold text-white mt-0.5">
                  {touchdownReport.verticalSpeedMS.toFixed(2)} m/s
                </div>
              </div>
              <div className="p-2.5 rounded bg-space-bg border border-space-border text-center">
                <span className="font-mono text-[10px] text-slate-400 uppercase">Lateral Drift</span>
                <div className="font-mono text-base font-bold text-white mt-0.5">
                  {touchdownReport.horizontalSpeedMS.toFixed(2)} m/s
                </div>
              </div>
              <div className="p-2.5 rounded bg-space-bg border border-space-border text-center">
                <span className="font-mono text-[10px] text-slate-400 uppercase">Surface Tilt</span>
                <div className="font-mono text-base font-bold text-white mt-0.5">
                  {touchdownReport.tiltDeg.toFixed(1)}°
                </div>
              </div>
              <div className="p-2.5 rounded bg-space-bg border border-space-border text-center">
                <span className="font-mono text-[10px] text-slate-400 uppercase">Fuel Margin</span>
                <div className="font-mono text-base font-bold text-telemetry-amber mt-0.5">
                  {touchdownReport.finalState.propellantKg.toFixed(1)} kg
                </div>
              </div>
            </div>

            {/* Instant Replay & Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-space-border">
              <button
                onClick={handleStartReplay}
                disabled={isReplaying}
                className="w-full sm:w-auto px-4 py-2 bg-space-bg hover:bg-space-border border border-space-border text-slate-200 font-mono text-xs uppercase flex items-center justify-center gap-2 rounded transition-colors"
              >
                <Tv className="w-3.5 h-3.5 text-sky-400" />
                {isReplaying ? `Replaying (${(replayProgress * 100).toFixed(0)}%)...` : "Instant Replay"}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleResetDescent}
                  className="flex-1 sm:flex-none px-4 py-2 bg-space-bg hover:bg-space-border border border-space-border text-slate-200 font-mono text-xs uppercase rounded transition-colors"
                >
                  Retry Descent
                </button>
                <button
                  onClick={() => {
                    unlockStage(6);
                    setCurrentStage(6);
                    if (onExit) onExit();
                  }}
                  className="flex-1 sm:flex-none px-5 py-2 bg-telemetry-amber hover:bg-amber-400 text-space-bg font-mono text-xs font-bold uppercase rounded flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Proceed to Debrief</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
