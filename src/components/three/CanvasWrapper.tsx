"use client";

import React, { Suspense, Component, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useSettingsStore } from "@/store/settings";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-space-950 p-6 text-center border border-space-800">
          <AlertTriangle className="w-10 h-10 text-alert-red mb-3 animate-pulse" />
          <div className="font-heading tracking-wider uppercase text-slate-200 text-sm mb-1">
            WEBGL RENDER CONTEXT FAULT
          </div>
          <div className="font-mono text-xs text-slate-400 max-w-sm mb-4">
            Hardware acceleration unavailable or GPU pipeline reset. Simulation metrics and calculations remain nominal.
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-telemetry-amber border border-telemetry-amber/50 hover:bg-telemetry-amber/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> REINITIALIZE PIPELINE
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoadingPlaceholder: React.FC = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-space-950/80 pointer-events-none">
    <div className="w-8 h-8 rounded-full border border-telemetry-amber/30 border-t-telemetry-amber animate-spin mb-3" />
    <span className="font-mono text-[10px] text-telemetry-amber tracking-widest uppercase">
      SYNCHRONIZING TELEMETRY STREAM...
    </span>
  </div>
);

export interface CanvasWrapperProps {
  children: ReactNode;
  className?: string;
  enablePostProcessing?: boolean;
}

export const CanvasWrapper: React.FC<CanvasWrapperProps> = ({
  children,
  className = "w-full h-full relative",
  enablePostProcessing = true,
}) => {
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality);
  const bloomEnabled = useSettingsStore((s) => s.bloomEnabled);
  const dpr: [number, number] = graphicsQuality === "HIGH" ? [1, 2] : [1, 1];

  return (
    <div className={className}>
      <CanvasErrorBoundary>
        <Suspense fallback={<LoadingPlaceholder />}>
          <Canvas
            dpr={dpr}
            gl={{
              antialias: graphicsQuality === "HIGH",
              powerPreference: "high-performance",
              alpha: false,
            }}
            camera={{ position: [2.5, 1.8, 3.8], fov: 45, near: 0.1, far: 2000 }}
            className="w-full h-full bg-[#05070D]"
          >
            <color attach="background" args={["#05070D"]} />
            {/* Space Lighting Environment */}
            <ambientLight intensity={0.4} color="#1E293B" />
            <directionalLight
              position={[12, 18, 10]}
              intensity={2.0}
              color="#FFFFFF"
              castShadow={false}
            />
            <directionalLight
              position={[-8, -10, -6]}
              intensity={0.6}
              color="#38BDF8"
            />
            {children}
            {enablePostProcessing && graphicsQuality === "HIGH" && bloomEnabled && (
              <EffectComposer multisampling={0}>
                <Bloom
                  intensity={0.45}
                  luminanceThreshold={0.85}
                  luminanceSmoothing={0.2}
                  mipmapBlur
                />
              </EffectComposer>
            )}
          </Canvas>
        </Suspense>
      </CanvasErrorBoundary>
    </div>
  );
};
