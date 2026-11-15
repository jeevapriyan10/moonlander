import { describe, it, expect } from "vitest";
import { runMissionSimulation } from "./simulator";
import { getDefaultMissionConfig } from "@/store/mission";
import { getCatalogLookup } from "@/data";
import { evaluateMission } from "../evaluate";

describe("Mission Operations Simulation Engine", () => {
  const catalog = getCatalogLookup();
  const defaultConfig = getDefaultMissionConfig("earth-watch", "INTERMEDIATE");
  const evaluation = evaluateMission(defaultConfig, catalog);

  it("produces deterministic time-stepped telemetry history", () => {
    const res1 = runMissionSimulation(defaultConfig, evaluation, { sampleSteps: 50, durationDays: 180 });
    const res2 = runMissionSimulation(defaultConfig, evaluation, { sampleSteps: 50, durationDays: 180 });

    expect(res1.timeline.length).toBe(51);
    expect(res1.totalScienceGb).toBe(res2.totalScienceGb);
    expect(res1.events.length).toBe(res2.events.length);
    expect(res1.events[0]?.id).toBe(res2.events[0]?.id);
  });

  it("subsystems deplete propellant and accumulate science over time", () => {
    const result = runMissionSimulation(defaultConfig, evaluation, { durationDays: 120 });
    expect(result.propellantRemainingKg).toBeLessThan(defaultConfig.propellantMassKg);
    expect(result.totalScienceGb).toBeGreaterThan(0);
    expect(result.finalRadiationKrad).toBeGreaterThan(0);
  });

  it("resolves anomalies automatically when CAPCOM Autopilot is enabled", () => {
    const result = runMissionSimulation(defaultConfig, evaluation, {
      autopilot: true,
      durationDays: 200,
    });

    expect(result.anomaliesEncountered).toBeGreaterThanOrEqual(2);
    for (const evt of result.events) {
      expect(evt.resolved).toBe(true);
      expect(evt.selectedOptionId).toBeDefined();
      expect(evt.resolutionLog).toBeDefined();
    }
  });

  it("handles manual player decision overrides cleanly", () => {
    const firstRun = runMissionSimulation(defaultConfig, evaluation, { durationDays: 200 });
    const firstEvt = firstRun.events[0];
    expect(firstEvt).toBeDefined();

    if (firstEvt) {
      const optionId = firstEvt.options[0]!.id;
      const secondRun = runMissionSimulation(defaultConfig, evaluation, {
        durationDays: 200,
        decisionOverrides: { [firstEvt.id]: optionId },
      });
      const resolvedEvt = secondRun.events.find((e) => e.id === firstEvt.id);
      expect(resolvedEvt?.resolved).toBe(true);
      expect(resolvedEvt?.selectedOptionId).toBe(optionId);
    }
  });
});
