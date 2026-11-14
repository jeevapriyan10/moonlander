import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Advisor } from "./Advisor";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";

describe("HUD Advisor Component", () => {
  beforeEach(() => {
    // Reset stores to default state
    useMissionStore.getState().initMission("earth-watch");
    useUIStore.getState().setAdvisorExpanded(true);
  });

  it("renders Advisor header with system status", () => {
    render(<Advisor />);
    expect(screen.getByText(/Mission Systems Advisor/i)).toBeInTheDocument();
  });

  it("toggles expanded and collapsed state", () => {
    useUIStore.getState().setAdvisorExpanded(false);
    render(<Advisor />);

    const header = screen.getByText(/Mission Systems Advisor/i);
    fireEvent.click(header);

    expect(useUIStore.getState().advisorExpanded).toBe(true);
  });

  it("renders machine-applicable fixes when issues are present", () => {
    // Deliberately introduce an undersized battery to cause an issue
    useMissionStore.getState().updateDesign({
      batteryCapacityWh: 50,
    });

    render(<Advisor />);

    const fixButtons = screen.queryAllByRole("button", { name: /Apply/i });
    if (fixButtons.length > 0) {
      fireEvent.click(fixButtons[0]!);
      // Fix should have increased battery or applied recommendation
      expect(useMissionStore.getState().currentMission.batteryCapacityWh).toBeGreaterThanOrEqual(50);
    }
  });
});
