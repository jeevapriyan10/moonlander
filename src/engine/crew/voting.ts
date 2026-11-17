/**
 * MoonLander Crew Voting & Proposal Resolution Engine
 * 
 * Rules:
 * - Simple majority of voting active roles approves a proposal.
 * - In the event of a tie, the MISSION_DIRECTOR cast breaks the tie.
 * - If the Mission Director abstains or opposes during a tie, the proposal is rejected.
 */

import type { CrewProposal, CrewRole, VoteChoice } from "./types";

export interface VoteResolutionResult {
  resolved: boolean;
  status: "approved" | "rejected" | "pending";
  tally: {
    yes: number;
    no: number;
    abstain: number;
    totalActive: number;
  };
  reason: string;
}

/**
 * Deterministically evaluates the voting state of a proposal.
 */
export function evaluateProposalVotes(
  proposal: CrewProposal,
  activeRoles: CrewRole[] = [
    "MISSION_DIRECTOR",
    "SPACECRAFT_ENGINEER",
    "FLIGHT_DYNAMICS",
    "COMMS_FINANCE",
  ]
): VoteResolutionResult {
  let yes = 0;
  let no = 0;
  let abstain = 0;

  for (const role of activeRoles) {
    const vote = proposal.votes[role];
    if (vote === "yes") yes++;
    else if (vote === "no") no++;
    else if (vote === "abstain") abstain++;
  }

  const votedCount = yes + no + abstain;
  const totalActive = activeRoles.length;
  const decisiveThreshold = Math.floor(totalActive / 2) + 1;

  // 1. Clear majority yes
  if (yes >= decisiveThreshold) {
    return {
      resolved: true,
      status: "approved",
      tally: { yes, no, abstain, totalActive },
      reason: `Proposal approved by majority vote (${yes}/${totalActive} yes).`,
    };
  }

  // 2. Clear majority no
  if (no >= decisiveThreshold) {
    return {
      resolved: true,
      status: "rejected",
      tally: { yes, no, abstain, totalActive },
      reason: `Proposal rejected by majority vote (${no}/${totalActive} no).`,
    };
  }

  // 3. All active roles have voted
  if (votedCount === totalActive) {
    if (yes > no) {
      return {
        resolved: true,
        status: "approved",
        tally: { yes, no, abstain, totalActive },
        reason: `Proposal passed with plurality (${yes} yes, ${no} no, ${abstain} abstain).`,
      };
    }

    if (no > yes) {
      return {
        resolved: true,
        status: "rejected",
        tally: { yes, no, abstain, totalActive },
        reason: `Proposal rejected with plurality (${no} no, ${yes} yes, ${abstain} abstain).`,
      };
    }

    // Tie condition: Mission Director breaks the tie
    const directorVote = proposal.votes["MISSION_DIRECTOR"];
    if (directorVote === "yes") {
      return {
        resolved: true,
        status: "approved",
        tally: { yes, no, abstain, totalActive },
        reason: "Tie resolved: Mission Director exercised tie-breaker approval authority.",
      };
    } else {
      return {
        resolved: true,
        status: "rejected",
        tally: { yes, no, abstain, totalActive },
        reason: "Tie resolved: Mission Director did not support; proposal failed to pass.",
      };
    }
  }

  // Still pending votes
  return {
    resolved: false,
    status: "pending",
    tally: { yes, no, abstain, totalActive },
    reason: `Pending additional votes (${votedCount}/${totalActive} votes cast).`,
  };
}
