import { describe, it, expect } from "vitest";
import { autoDesign } from "./autodesign";

describe("Auto-Design Systems Engineering Engine", () => {
  it("synthesizes a launch-ready cheapest configuration for earth-watch", () => {
    const result = autoDesign("earth-watch", "INTERMEDIATE", "cheapest");
    expect(result.config).toBeDefined();
    expect(result.evaluation).toBeDefined();
    expect(result.evaluation.launchReady).toBe(true);
    expect(result.evaluation.validation.filter((v) => v.severity === "error")).toHaveLength(0);
    expect(result.explanations.payload).toBeDefined();
    expect(result.rationaleSummary.length).toBeGreaterThan(0);
  });

  it("synthesizes a launch-ready safest configuration with high margins", () => {
    const result = autoDesign("earth-watch", "ADVANCED", "safest");
    expect(result.config).toBeDefined();
    expect(result.evaluation.launchReady).toBe(true);
    expect(result.evaluation.mass.growthMarginPercent).toBeGreaterThanOrEqual(10);
    expect(result.config.flightComputerId).toBe("fc-fault-tolerant-dual");
  });

  it("synthesizes a launch-ready best-science configuration for exoplanet-hunter", () => {
    const result = autoDesign("exoplanet-hunter", "INTERMEDIATE", "best-science");
    expect(result.config).toBeDefined();
    expect(result.evaluation.launchReady).toBe(true);
    expect(result.config.adcsId).toBe("adcs-reaction-wheels");
    expect(result.config.commsId).toBe("comms-ka-band");
  });
});
