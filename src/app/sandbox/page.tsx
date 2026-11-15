"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";

export default function SandboxPage() {
  const router = useRouter();
  const { createMission } = useMissionStore();
  const { setCurrentStage, unlockStage } = useUIStore();

  useEffect(() => {
    // Initialize open sandbox mission with no budget/schedule penalties
    createMission("earth-watch", "ADVANCED", true);
    unlockStage(6); // Sandbox unlocks all stages for free exploration
    setCurrentStage(3); // Jump straight to Design stage
    router.replace("/mission/sandbox");
  }, [createMission, setCurrentStage, unlockStage, router]);

  return (
    <div className="min-h-screen bg-space-bg flex flex-col items-center justify-center font-mono text-xs text-telemetry-amber">
      <div className="w-8 h-8 rounded-full border border-telemetry-amber/30 border-t-telemetry-amber animate-spin mb-3" />
      <span>INITIALIZING UNCONSTRAINED SANDBOX STUDIO...</span>
    </div>
  );
}
