import { describe, it, expect } from "vitest";
import { validateCallsign } from "@/lib/auth/callsign";

describe("Pilot Callsign Validation & Profanity Filter", () => {
  it("accepts valid aerospace callsigns", () => {
    const validNames = ["Astro", "Valkyrie-1", "Phoenix_99", "Nova", "Eagle-Eye", "ML-Commander"];
    for (const name of validNames) {
      const res = validateCallsign(name);
      expect(res.valid, `Expected "${name}" to be valid`).toBe(true);
      expect(res.sanitized).toBe(name);
    }
  });

  it("rejects callsigns that are too short", () => {
    const res = validateCallsign("AB");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("at least 3 characters");
  });

  it("rejects callsigns that are too long", () => {
    const res = validateCallsign("CommanderVeryLongCallsignName12345");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("must not exceed 20 characters");
  });

  it("rejects invalid symbols and emojis", () => {
    const invalidNames = ["Astro🚀", "Pilot@Base", "Nova#1", "Star*Gazer", "Flight Controller"];
    for (const name of invalidNames) {
      const res = validateCallsign(name);
      expect(res.valid, `Expected "${name}" to be rejected`).toBe(false);
      expect(res.error).toContain("hyphens (-), and underscores (_)");
    }
  });

  it("rejects prohibited and profane language", () => {
    const blockedNames = ["bad-asshole-1", "BitchPilot", "NaziLeader", "dick-99"];
    for (const name of blockedNames) {
      const res = validateCallsign(name);
      expect(res.valid, `Expected "${name}" to be rejected for profanity`).toBe(false);
      expect(res.error).toContain("prohibited or restricted language");
    }
  });
});
