import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dashboard } from "./Dashboard";

describe("HUD Dashboard Component", () => {
  it("renders primary aerospace telemetry sections", () => {
    render(<Dashboard />);

    // Mass Telemetry
    expect(screen.getByText(/Mass Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText(/Bus Dry Mass Limit/i)).toBeInTheDocument();

    // Power & Battery
    expect(screen.getByText(/Power & Battery/i)).toBeInTheDocument();
    expect(screen.getByText(/Power Margin/i)).toBeInTheDocument();

    // Lifecycle Economics
    expect(screen.getByText(/Lifecycle Economics/i)).toBeInTheDocument();
    expect(screen.getByText(/Budget Allocation/i)).toBeInTheDocument();

    // Comms & Data Flow
    expect(screen.getByText(/Comms & Data Flow/i)).toBeInTheDocument();

    // System Risk & Durability
    expect(screen.getByText(/System Risk & Durability/i)).toBeInTheDocument();
  });

  it("triggers onProceedToOrbit callback when action button clicked", () => {
    const handleProceed = vi.fn();
    render(<Dashboard onProceedToOrbit={handleProceed} />);

    const button = screen.getByRole("button", { name: /Proceed to Orbit & Launch/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleProceed).toHaveBeenCalledTimes(1);
  });
});
