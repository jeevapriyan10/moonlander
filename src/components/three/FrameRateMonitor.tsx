"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSettingsStore, type GraphicsQuality } from "@/store/settings";
import { useUIStore } from "@/store/ui";

export const FrameRateMonitor: React.FC = () => {
  const lagAccumulatorRef = useRef(0);
  const cooldownRef = useRef(0);
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality);
  const setGraphicsQuality = useSettingsStore((s) => s.setGraphicsQuality);
  const addToast = useUIStore((s) => s.addToast);

  useFrame((_, delta) => {
    if (cooldownRef.current > 0) {
      cooldownRef.current -= delta;
      return;
    }

    // Delta > 0.034 corresponds to < 29.4 FPS (frame drop)
    if (delta > 0.034) {
      lagAccumulatorRef.current += delta;
    } else {
      lagAccumulatorRef.current = Math.max(0, lagAccumulatorRef.current - delta * 0.5);
    }

    // If frame drops persist for 3.0 seconds, auto-downgrade quality tier
    if (lagAccumulatorRef.current >= 3.0) {
      lagAccumulatorRef.current = 0;
      cooldownRef.current = 15.0; // Wait at least 15s before any subsequent adjustment

      let nextTier: GraphicsQuality | null = null;
      if (graphicsQuality === "ULTRA") nextTier = "HIGH";
      else if (graphicsQuality === "HIGH") nextTier = "MEDIUM";
      else if (graphicsQuality === "MEDIUM") nextTier = "LOW";

      if (nextTier) {
        setGraphicsQuality(nextTier);
        addToast({
          type: "info",
          title: "PERFORMANCE OPTIMIZATION",
          message: `Graphics adjusted to ${nextTier} to maintain 60 FPS target. You can revert in Settings.`,
        });
      }
    }
  });

  return null;
};
