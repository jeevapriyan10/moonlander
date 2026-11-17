/**
 * MoonLander Daily Challenge Generator
 * 
 * Generates deterministic, globally synchronized mission configurations
 * seeded by the current UTC calendar date.
 */

import scenariosData from "@/data/scenarios.json";

export interface DailyChallengeSpec {
  dateString: string; // YYYY-MM-DD
  seed: string; // ML-DAILY-YYYYMMDD
  scenarioId: string;
  scenarioTitle: string;
  difficulty: "INTERMEDIATE" | "ADVANCED";
  dayIndex: number;
  bonusMultiplier: number;
}

/**
 * Returns the deterministic daily challenge for any given UTC date (defaults to today).
 */
export function getDailyChallenge(targetDate = new Date()): DailyChallengeSpec {
  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getUTCDate()).padStart(2, "0");

  const dateString = `${year}-${month}-${day}`;
  const seed = `ML-DAILY-${year}${month}${day}`;

  // Days since Unix epoch
  const epochMs = Date.UTC(2026, 0, 1);
  const currentMs = Date.UTC(year, targetDate.getUTCMonth(), targetDate.getUTCDate());
  const dayIndex = Math.max(0, Math.floor((currentMs - epochMs) / (1000 * 60 * 60 * 24)));

  // Filter playable non-tutorial scenarios
  const eligibleScenarios = scenariosData.filter(
    (s) => s.playable && s.id !== "tutorial-leo" && s.id !== "sandbox"
  );

  const fallbackScenario = scenariosData[0]!;
  const scenario =
    (eligibleScenarios.length > 0
      ? eligibleScenarios[dayIndex % eligibleScenarios.length]
      : null) ?? fallbackScenario;
  const difficulty = (dayIndex % 2 === 0 ? "INTERMEDIATE" : "ADVANCED") as "INTERMEDIATE" | "ADVANCED";
  const bonusMultiplier = 1.25 + ((dayIndex % 5) * 0.05);

  return {
    dateString,
    seed,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    difficulty,
    dayIndex,
    bonusMultiplier,
  };
}
