import { describe, it, expect } from "vitest";
import { evaluateProposalVotes, type CrewProposal } from "@/engine/crew";

describe("Crew Mode: Proposal Voting & Tie-Breaker Engine", () => {
  const baseProposal: CrewProposal = {
    id: "prop-1",
    proposerRole: "SPACECRAFT_ENGINEER",
    proposerCallsign: "ChiefEng",
    title: "Upgrade Bus to Midsize",
    description: "Increases payload capacity for radar sensor.",
    affectedFields: ["busId"],
    patch: { busId: "bus-midsize" },
    createdAt: Date.now(),
    status: "pending",
    votes: {},
  };

  it("approves proposal when clear majority is reached", () => {
    const proposal: CrewProposal = {
      ...baseProposal,
      votes: {
        MISSION_DIRECTOR: "yes",
        SPACECRAFT_ENGINEER: "yes",
        FLIGHT_DYNAMICS: "yes",
        COMMS_FINANCE: "no",
      },
    };

    const res = evaluateProposalVotes(proposal);
    expect(res.resolved).toBe(true);
    expect(res.status).toBe("approved");
    expect(res.tally.yes).toBe(3);
    expect(res.tally.no).toBe(1);
  });

  it("rejects proposal when clear majority votes no", () => {
    const proposal: CrewProposal = {
      ...baseProposal,
      votes: {
        MISSION_DIRECTOR: "no",
        SPACECRAFT_ENGINEER: "yes",
        FLIGHT_DYNAMICS: "no",
        COMMS_FINANCE: "no",
      },
    };

    const res = evaluateProposalVotes(proposal);
    expect(res.resolved).toBe(true);
    expect(res.status).toBe("rejected");
    expect(res.tally.no).toBe(3);
  });

  it("exercises Mission Director tie-breaker to approve a 2-2 tie", () => {
    const tiedProposal: CrewProposal = {
      ...baseProposal,
      votes: {
        MISSION_DIRECTOR: "yes", // Director votes YES on tie
        SPACECRAFT_ENGINEER: "yes",
        FLIGHT_DYNAMICS: "no",
        COMMS_FINANCE: "no",
      },
    };

    const res = evaluateProposalVotes(tiedProposal);
    expect(res.resolved).toBe(true);
    expect(res.status).toBe("approved");
    expect(res.reason).toContain("Mission Director exercised tie-breaker approval authority");
  });

  it("exercises Mission Director tie-breaker to reject a 2-2 tie", () => {
    const tiedProposal: CrewProposal = {
      ...baseProposal,
      votes: {
        MISSION_DIRECTOR: "no", // Director votes NO on tie
        SPACECRAFT_ENGINEER: "yes",
        FLIGHT_DYNAMICS: "yes",
        COMMS_FINANCE: "no",
      },
    };

    const res = evaluateProposalVotes(tiedProposal);
    expect(res.resolved).toBe(true);
    expect(res.status).toBe("rejected");
    expect(res.reason).toContain("Mission Director did not support");
  });

  it("keeps proposal pending when votes are incomplete", () => {
    const incompleteProposal: CrewProposal = {
      ...baseProposal,
      votes: {
        MISSION_DIRECTOR: "yes",
        SPACECRAFT_ENGINEER: "yes",
      },
    };

    const res = evaluateProposalVotes(incompleteProposal);
    expect(res.resolved).toBe(false);
    expect(res.status).toBe("pending");
  });
});
