import { describe, it, expect, vi } from "vitest";
import { generateMissionCardBlob, type MissionCardData } from "@/lib/share/missionCard";

describe("Mission Card Exporter (PNG)", () => {
  it("renders card onto HTML5 canvas with all tactical telemetry metrics", async () => {
    const mockContext = {
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      font: "",
    };

    const mockBlob = new Blob(["mock-png-data"], { type: "image/png" });

    // Mock canvas implementation
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") {
        const el = origCreateElement("canvas");
        el.getContext = vi.fn().mockReturnValue(mockContext);
        el.toBlob = vi.fn((cb) => {
          cb(mockBlob);
        });
        return el;
      }
      return origCreateElement(tagName);
    });

    const cardData: MissionCardData = {
      missionName: "Vanguard Titan Probe",
      scenarioTitle: "Titan Methane Ocean Probe",
      difficulty: "ADVANCED",
      seed: "ML-TITAN-2026",
      callsign: "Commander-Atlas",
      rank: "FLIGHT DIRECTOR",
      score: 9750,
      grade: "S",
      costM: 92.4,
      massKg: 520,
      deltaVKmS: 3.4,
      scienceReturnPercent: 99,
      orbitName: "Titan Polar Science",
      launcherName: "Heavy Lift Alpha",
      completedDate: "2026-11-17",
    };

    const blob = await generateMissionCardBlob(cardData);
    expect(blob).toBeDefined();
    expect(blob.type).toBe("image/png");

    // Verify key drawing commands occurred
    expect(mockContext.fillRect).toHaveBeenCalled();
    expect(mockContext.strokeRect).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});
