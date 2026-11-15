import { describe, it, expect } from "vitest";
import { CAMPAIGN_CHAPTERS } from "./chapters";
import { CHARACTERS } from "./types";
import { scenarios } from "@/data";
import type { DialogScene, ScriptNode } from "./types";

describe("Meridian Space Authority Campaign Narrative Graph", () => {
  it("includes all Stage 2 required chapters (Prologue + Act I + Act II)", () => {
    const ids = CAMPAIGN_CHAPTERS.map((c) => c.id);
    expect(ids).toContain("prologue");
    expect(ids).toContain("ch-1");
    expect(ids).toContain("ch-2");
    expect(ids).toContain("ch-3");
    expect(ids).toContain("ch-4");
    expect(ids).toContain("ch-5");
    expect(CAMPAIGN_CHAPTERS.length).toBe(6);
  });

  it("links every chapter to a valid, playable mission scenario", () => {
    const scenarioIds = new Set(scenarios.map((s) => s.id));
    for (const ch of CAMPAIGN_CHAPTERS) {
      expect(scenarioIds.has(ch.linkedScenarioId)).toBe(true);
    }
  });

  function validateSceneGraph(scene: DialogScene, sceneName: string) {
    expect(scene.startNodeId, `${sceneName} must have a startNodeId`).toBeDefined();
    expect(scene.nodes[scene.startNodeId], `${sceneName} startNodeId '${scene.startNodeId}' must exist in nodes`).toBeDefined();

    for (const [nodeId, node] of Object.entries(scene.nodes)) {
      if (node.type === "say") {
        expect(CHARACTERS[node.speaker], `Speaker '${node.speaker}' in node '${nodeId}' must be a registered character`).toBeDefined();
        expect(node.text.length, `Say node '${nodeId}' must have non-empty text`).toBeGreaterThan(10);
        if (node.nextNodeId) {
          expect(scene.nodes[node.nextNodeId], `Say node '${nodeId}' references non-existent nextNodeId '${node.nextNodeId}'`).toBeDefined();
        }
      } else if (node.type === "choice") {
        expect(node.options.length, `Choice node '${nodeId}' must have at least 2 options`).toBeGreaterThanOrEqual(2);
        for (const opt of node.options) {
          expect(opt.label.length, `Option in '${nodeId}' must have label`).toBeGreaterThan(0);
          expect(scene.nodes[opt.nextNodeId], `Choice in '${nodeId}' references non-existent target '${opt.nextNodeId}'`).toBeDefined();
        }
      } else if (node.type === "goto") {
        expect(scene.nodes[node.nextNodeId], `Goto node '${nodeId}' references non-existent target '${node.nextNodeId}'`).toBeDefined();
      }
    }
  }

  it("guarantees every briefing scene graph is valid with zero dead ends", () => {
    for (const ch of CAMPAIGN_CHAPTERS) {
      validateSceneGraph(ch.briefing, `Chapter ${ch.id} briefing`);
    }
  });

  it("guarantees every epilogue scene (success, partial, failure) is valid with zero dead ends", () => {
    for (const ch of CAMPAIGN_CHAPTERS) {
      validateSceneGraph(ch.epilogue.success, `Chapter ${ch.id} success epilogue`);
      validateSceneGraph(ch.epilogue.partial, `Chapter ${ch.id} partial epilogue`);
      validateSceneGraph(ch.epilogue.failure, `Chapter ${ch.id} failure epilogue`);
    }
  });
});
