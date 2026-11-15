import { describe, it, expect } from "vitest";
import { codex, buses, orbits, launchers, solarArrays, batteries, propulsions, adcsSystems, flightComputers, thermals, commsSystems } from "@/data";

describe("Space Codex Comprehensive Coverage", () => {
  it("contains at least 80 verified aerospace entries", () => {
    expect(codex.length).toBeGreaterThanOrEqual(80);
  });

  it("covers all 6 canonical categories with substantial depth", () => {
    const categories = new Set(codex.map((e) => e.category));
    expect(categories.has("subsystems")).toBe(true);
    expect(categories.has("orbits")).toBe(true);
    expect(categories.has("environment")).toBe(true);
    expect(categories.has("operations")).toBe(true);
    expect(categories.has("real-missions")).toBe(true);
    expect(categories.has("physics")).toBe(true);

    for (const cat of ["subsystems", "orbits", "environment", "operations", "real-missions", "physics"] as const) {
      const count = codex.filter((e) => e.category === cat).length;
      expect(count).toBeGreaterThanOrEqual(10);
    }
  });

  it("contains no broken relatedIds references", () => {
    const allIds = new Set(codex.map((e) => e.id));
    for (const entry of codex) {
      for (const relId of entry.relatedIds) {
        expect(allIds.has(relId), `Entry "${entry.id}" has unknown relatedId: "${relId}"`).toBe(true);
      }
    }
  });

  it("has valid plain language names and 1-sentence summaries for all entries", () => {
    for (const entry of codex) {
      expect(entry.plainLanguageName).toBeDefined();
      expect(entry.plainLanguageName!.length).toBeGreaterThan(2);
      expect(entry.summary.length).toBeGreaterThan(15);
      expect(entry.technicalDefinition.length).toBeGreaterThan(30);
      expect(entry.historicalExample.length).toBeGreaterThan(20);
      expect(entry.gameplayImpact.length).toBeGreaterThan(20);
      if (entry.externalUrl) {
        expect(entry.externalUrl.startsWith("https://")).toBe(true);
      }
    }
  });

  it("provides conceptual coverage for all major spacecraft subsystems and orbits", () => {
    const codexIds = new Set(codex.map((e) => e.id));

    // ADCS & guidance
    expect(codexIds.has("adcs")).toBe(true);
    expect(codexIds.has("reaction-wheels")).toBe(true);
    expect(codexIds.has("star-tracker")).toBe(true);

    // Power
    expect(codexIds.has("triple-junction-gaas") || codexIds.has("solar-flux")).toBe(true);
    expect(codexIds.has("li-ion-battery")).toBe(true);

    // Propulsion
    expect(codexIds.has("hydrazine-monoprop") || codexIds.has("hall-effect-thruster")).toBe(true);
    expect(codexIds.has("tsiolkovsky-rocket-equation")).toBe(true);

    // Comms
    expect(codexIds.has("x-band-transceiver") || codexIds.has("ka-band-transceiver")).toBe(true);
    expect(codexIds.has("link-margin")).toBe(true);

    // Orbits
    expect(codexIds.has("leo")).toBe(true);
    expect(codexIds.has("sso")).toBe(true);
    expect(codexIds.has("geo")).toBe(true);
  });
});
