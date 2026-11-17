import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/verify-mission/route";
import { getDefaultMissionConfig } from "@/store/mission";

describe("Server-Side Mission Verification & Anti-Cheat API", () => {
  it("verifies a legitimate nominal mission configuration", async () => {
    const validConfig = getDefaultMissionConfig("earth-watch", "INTERMEDIATE", false);

    const request = new Request("http://localhost:3000/api/verify-mission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        design: validConfig,
        score: 8400,
        callsign: "Cadet-Echo",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.verified).toBe(true);
    expect(data.score).toBe(8400);
    expect(data.verifiedMetrics.launchReady).toBe(true);
    expect(data.verifiedMetrics.totalCostM).toBeGreaterThan(0);
    expect(data.verifiedMetrics.deltaVAvailableMs).toBeGreaterThan(0);
  });

  it("rejects an impossible configuration with severe engineering errors", async () => {
    const brokenConfig = {
      ...getDefaultMissionConfig("earth-watch", "INTERMEDIATE", false),
      busId: "bus-cubesat-3u", // tiny 4 kg bus
      propellantMassKg: 5000, // 5,000 kg propellant stuffed into a 4 kg cubesat!
    };

    const request = new Request("http://localhost:3000/api/verify-mission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        design: brokenConfig,
        score: 9999,
        callsign: "Cheater-1",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(422);

    const data = await response.json();
    expect(data.verified).toBe(false);
    expect(data.details).toBeDefined();
    expect(data.details.length).toBeGreaterThan(0);
  });

  it("detects and rejects cost forgery (claimed $5M when actual is $90M+)", async () => {
    const validConfig = getDefaultMissionConfig("earth-watch", "INTERMEDIATE", false);

    const request = new Request("http://localhost:3000/api/verify-mission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        design: validConfig,
        score: 9200,
        claimedMetrics: {
          totalCostM: 5.0, // Cheated cost
        },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(422);

    const data = await response.json();
    expect(data.verified).toBe(false);
    expect(data.error).toContain("deviates from verified physics engine cost");
  });

  it("detects and rejects delta-v forgery", async () => {
    const validConfig = getDefaultMissionConfig("earth-watch", "INTERMEDIATE", false);

    const request = new Request("http://localhost:3000/api/verify-mission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        design: validConfig,
        score: 9200,
        claimedMetrics: {
          deltaVMs: 25000, // Cheated delta-v
        },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(422);

    const data = await response.json();
    expect(data.verified).toBe(false);
    expect(data.error).toContain("deviates from verified rocket equation");
  });
});
