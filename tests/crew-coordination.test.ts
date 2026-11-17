import { describe, it, expect } from "vitest";
import {
  calculateTeamCoordinationScore,
  type CrewOp,
  type CrewProposal,
} from "@/engine/crew";
import { evaluateMission } from "@/engine/evaluate";
import { getDefaultMissionConfig } from "@/store/mission";
import { createCatalogLookup } from "@/data";

describe("Crew Mode: Team Coordination Score & Daily Challenge", () => {
  const catalog = createCatalogLookup();
  const validConfig = getDefaultMissionConfig("earth-watch", "INTERMEDIATE", false);
  const evaluation = evaluateMission(validConfig, catalog);

  it("calculates full 15 points for a balanced, low-friction mission", () => {
    const balancedOps: CrewOp[] = [
      { opId: "1", role: "MISSION_DIRECTOR", clientId: "1", clientCallsign: "D", patch: {}, baseVersion: 0, resultingVersion: 1, timestamp: 100 },
      { opId: "2", role: "SPACECRAFT_ENGINEER", clientId: "2", clientCallsign: "E", patch: {}, baseVersion: 1, resultingVersion: 2, timestamp: 200 },
      { opId: "3", role: "FLIGHT_DYNAMICS", clientId: "3", clientCallsign: "F", patch: {}, baseVersion: 2, resultingVersion: 3, timestamp: 300 },
      { opId: "4", role: "COMMS_FINANCE", clientId: "4", clientCallsign: "C", patch: {}, baseVersion: 3, resultingVersion: 4, timestamp: 400 },
    ];

    const approvedProposals: CrewProposal[] = [
      {
        id: "p1",
        proposerRole: "SPACECRAFT_ENGINEER",
        proposerCallsign: "E",
        title: "Adjust Solar",
        description: "",
        affectedFields: [],
        patch: {},
        createdAt: 1000,
        expiresAt: 15000, // 14s resolution (< 30s)
        status: "approved",
        votes: { MISSION_DIRECTOR: "yes", SPACECRAFT_ENGINEER: "yes", FLIGHT_DYNAMICS: "yes", COMMS_FINANCE: "yes" },
      },
    ];

    const score = calculateTeamCoordinationScore({
      opLog: balancedOps,
      proposals: approvedProposals,
      evaluation,
    });

    expect(score.totalPoints).toBe(15);
    expect(score.breakdown.balancedContribution).toBe(5);
    expect(score.breakdown.disputeResolutionSpeed).toBe(4);
    expect(score.breakdown.vetoPenalty).toBe(3);
    expect(score.breakdown.marginAgreement).toBe(3);
  });

  it("penalizes uncoordinated solo dominating and vetoed motions", () => {
    // Only 1 role made all edits
    const soloOps: CrewOp[] = [
      { opId: "1", role: "MISSION_DIRECTOR", clientId: "1", clientCallsign: "D", patch: {}, baseVersion: 0, resultingVersion: 1, timestamp: 100 },
      { opId: "2", role: "MISSION_DIRECTOR", clientId: "1", clientCallsign: "D", patch: {}, baseVersion: 1, resultingVersion: 2, timestamp: 200 },
    ];

    const vetoedProposals: CrewProposal[] = [
      { id: "p1", proposerRole: "SPACECRAFT_ENGINEER", proposerCallsign: "E", title: "", description: "", affectedFields: [], patch: {}, createdAt: 1000, expiresAt: 200000, status: "rejected", votes: {} },
      { id: "p2", proposerRole: "FLIGHT_DYNAMICS", proposerCallsign: "F", title: "", description: "", affectedFields: [], patch: {}, createdAt: 1000, expiresAt: 200000, status: "rejected", votes: {} },
      { id: "p3", proposerRole: "COMMS_FINANCE", proposerCallsign: "C", title: "", description: "", affectedFields: [], patch: {}, createdAt: 1000, expiresAt: 200000, status: "rejected", votes: {} },
    ];

    const score = calculateTeamCoordinationScore({
      opLog: soloOps,
      proposals: vetoedProposals,
      evaluation,
    });

    expect(score.breakdown.balancedContribution).toBe(1); // 1 role
    expect(score.breakdown.vetoPenalty).toBe(0); // 3 vetoes
    expect(score.totalPoints).toBeLessThan(10);
    expect(score.summary).toContain("friction");
  });
});
