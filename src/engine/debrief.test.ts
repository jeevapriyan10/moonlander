import { describe, it, expect } from "vitest";
import { generateMissionDebrief } from "./debrief";
import { getDefaultMissionConfig } from "@/store/mission";
import { getCatalogLookup } from "@/data";
import { evaluateMission } from "./evaluate";

describe("Causal Mission Debrief & Scoring Engine", () => {
  const catalog = getCatalogLookup();
  const earthWatchConfig = getDefaultMissionConfig("earth-watch", "INTERMEDIATE");
  const evaluation = evaluateMission(earthWatchConfig, catalog);

  it("calculates a valid 100-point score and grade", () => {
    const debrief = generateMissionDebrief(earthWatchConfig, evaluation);

    expect(debrief.overallScore).toBeGreaterThanOrEqual(0);
    expect(debrief.overallScore).toBeLessThanOrEqual(100);
    expect(["S", "A", "B", "C", "D"]).toContain(debrief.overallGrade);

    // Sum of max points should be 100
    const totalMax = debrief.scoreBreakdown.reduce((sum, item) => sum + item.maxPoints, 0);
    expect(totalMax).toBe(100);
  });

  it("identifies positive and negative causal drivers", () => {
    const debrief = generateMissionDebrief(earthWatchConfig, evaluation);

    expect(debrief.causalDrivers.length).toBeGreaterThanOrEqual(2);
    for (const driver of debrief.causalDrivers) {
      expect(["positive", "negative"]).toContain(driver.type);
      expect(driver.headline.length).toBeGreaterThan(5);
      expect(driver.explanation.length).toBeGreaterThan(15);
    }
  });

  it("links to real NASA flight twin Landsat 9", () => {
    const debrief = generateMissionDebrief(earthWatchConfig, evaluation);

    expect(debrief.historicalTwin).not.toBeNull();
    expect(debrief.historicalTwin?.name).toBe("Landsat 9");
    expect(debrief.historicalTwin?.launchMassKg).toBe(2711);
  });

  it("evaluates counterfactual What-If scenarios with score deltas", () => {
    const debrief = generateMissionDebrief(earthWatchConfig, evaluation);

    expect(debrief.whatIfScenarios.length).toBeGreaterThanOrEqual(1);
    for (const whatIf of debrief.whatIfScenarios) {
      expect(whatIf.title.length).toBeGreaterThan(5);
      expect(whatIf.hypotheticalScore).toBeGreaterThanOrEqual(0);
      expect(whatIf.hypotheticalScore).toBeLessThanOrEqual(100);
      expect(typeof whatIf.scoreDelta).toBe("number");
    }
  });
});
