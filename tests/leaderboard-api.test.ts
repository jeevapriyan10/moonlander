import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/leaderboard/route";

describe("Leaderboard API & Privacy Guarantees", () => {
  it("returns ranked entries with requested scenario, difficulty, and period", async () => {
    const req = new Request("http://localhost:3000/api/leaderboard?scenarioId=earth-watch&difficulty=ADVANCED&period=weekly");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.scenarioId).toBe("earth-watch");
    expect(data.difficulty).toBe("ADVANCED");
    expect(data.period).toBe("weekly");
    expect(Array.isArray(data.entries)).toBe(true);
    expect(data.entries.length).toBeGreaterThan(0);

    // Verify ordering by score descending
    for (let i = 0; i < data.entries.length - 1; i++) {
      expect(data.entries[i].score).toBeGreaterThanOrEqual(data.entries[i + 1].score);
    }
  });

  it("strictly enforces privacy: exposes ONLY callsign and avatarSeed, zero emails or user IDs", async () => {
    const req = new Request("http://localhost:3000/api/leaderboard?scenarioId=mars-perseverance&difficulty=INTERMEDIATE");
    const res = await GET(req);
    const data = await res.json();

    for (const entry of data.entries) {
      expect(entry).toHaveProperty("callsign");
      expect(entry).toHaveProperty("avatarSeed");
      expect(entry).toHaveProperty("score");

      // Privacy checks: no email, token, or auth user ID
      expect(entry.email).toBeUndefined();
      expect(entry.user_id).toBeUndefined();
      expect(entry.userId).toBeUndefined();
      expect(entry.token).toBeUndefined();
    }
  });

  it("handles valid score submission via POST", async () => {
    const payload = {
      callsign: "Valkyrie-Nine",
      scenarioId: "earth-watch",
      difficulty: "ADVANCED",
      score: 9540,
      scienceReturnPercent: 98,
      costM: 78.5,
      massKg: 460,
      deltaVKmS: 2.1,
    };

    const req = new Request("http://localhost:3000/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.success).toBe(true);
    expect(result.entry.callsign).toBe("Valkyrie-Nine");
    expect(result.entry.score).toBe(9540);
  });

  it("rejects invalid score submission missing required fields", async () => {
    const req = new Request("http://localhost:3000/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: 500 }), // missing callsign & scenarioId
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
