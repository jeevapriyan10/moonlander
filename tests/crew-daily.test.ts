import { describe, it, expect } from "vitest";
import { getDailyChallenge } from "@/engine/crew";

describe("Daily Challenge Deterministic Engine", () => {
  it("generates deterministic seed and scenario for identical dates", () => {
    const fixedDate = new Date("2026-11-17T12:00:00Z");

    const challengeA = getDailyChallenge(fixedDate);
    const challengeB = getDailyChallenge(fixedDate);

    expect(challengeA.seed).toBe("ML-DAILY-20261117");
    expect(challengeA.dateString).toBe("2026-11-17");
    expect(challengeA.scenarioId).toBe(challengeB.scenarioId);
    expect(challengeA.difficulty).toBe(challengeB.difficulty);
    expect(challengeA.bonusMultiplier).toBe(challengeB.bonusMultiplier);
  });

  it("advances challenge configuration on subsequent dates", () => {
    const day1 = new Date("2026-11-17T00:00:00Z");
    const day2 = new Date("2026-11-18T00:00:00Z");

    const challenge1 = getDailyChallenge(day1);
    const challenge2 = getDailyChallenge(day2);

    expect(challenge1.seed).not.toBe(challenge2.seed);
    expect(challenge1.dateString).toBe("2026-11-17");
    expect(challenge2.dateString).toBe("2026-11-18");
  });
});
