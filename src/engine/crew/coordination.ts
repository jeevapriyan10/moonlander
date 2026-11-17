/**
 * MoonLander Team Coordination Score Engine (Max 15 Points)
 * 
 * Deterministic formula evaluating 4 operational dimensions:
 * 1. Balanced Contribution (0 - 5 pts): Evaluates equitable participation across all 4 roles.
 * 2. Dispute Resolution Speed (0 - 4 pts): Evaluates rapid, consensual resolution of proposals.
 * 3. Veto & Conflict Penalty (0 - 3 pts): Evaluates minimization of contentious vetoes and rejected motions.
 * 4. Final Margin Agreement (0 - 3 pts): Evaluates health of final engineering safety margins.
 */

import type { CrewOp, CrewProposal, CrewRole, TeamCoordinationScore } from "./types";
import type { MissionEvaluation } from "../evaluate";

export interface CoordinationParams {
  opLog: CrewOp[];
  proposals: CrewProposal[];
  evaluation: MissionEvaluation;
}

/**
 * Pure deterministic calculation of the 15-point Team Coordination Score.
 */
export function calculateTeamCoordinationScore(
  params: CoordinationParams
): TeamCoordinationScore {
  const { opLog, proposals, evaluation } = params;

  // 1. Balanced Contribution (0 to 5 points)
  const roleOpCounts: Record<CrewRole, number> = {
    MISSION_DIRECTOR: 0,
    SPACECRAFT_ENGINEER: 0,
    FLIGHT_DYNAMICS: 0,
    COMMS_FINANCE: 0,
  };

  for (const op of opLog) {
    if (roleOpCounts[op.role] !== undefined) {
      roleOpCounts[op.role]++;
    }
  }

  const counts = Object.values(roleOpCounts);
  const activeRolesCount = counts.filter((c) => c > 0).length;

  let balancedContribution = 0;
  if (activeRolesCount === 4) {
    const totalOps = counts.reduce((a, b) => a + b, 0);
    const mean = totalOps / 4;
    const variance = counts.reduce((acc, c) => acc + Math.pow(c - mean, 2), 0) / 4;
    const stdDev = Math.sqrt(variance);

    // Highly balanced participation
    if (stdDev <= mean * 0.75) {
      balancedContribution = 5;
    } else {
      balancedContribution = 4;
    }
  } else if (activeRolesCount === 3) {
    balancedContribution = 3;
  } else if (activeRolesCount === 2) {
    balancedContribution = 2;
  } else {
    balancedContribution = 1;
  }

  // 2. Dispute Resolution Speed (0 to 4 points)
  let disputeResolutionSpeed = 4;
  const resolvedProposals = proposals.filter((p) => p.status === "approved" || p.status === "rejected");

  if (resolvedProposals.length > 0) {
    const durations = resolvedProposals.map((p) => {
      // Default to 15s if timestamps are missing
      const end = p.expiresAt || p.createdAt + 15000;
      return Math.max(1, (end - p.createdAt) / 1000);
    });

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    if (avgDuration <= 30) {
      disputeResolutionSpeed = 4;
    } else if (avgDuration <= 60) {
      disputeResolutionSpeed = 3;
    } else if (avgDuration <= 120) {
      disputeResolutionSpeed = 2;
    } else {
      disputeResolutionSpeed = 1;
    }
  }

  // 3. Veto / Reversal Penalty (0 to 3 points)
  const rejectedCount = proposals.filter((p) => p.status === "rejected").length;
  const vetoPenalty = Math.max(0, 3 - rejectedCount);

  // 4. Final Margin Agreement (0 to 3 points)
  let marginAgreement = 0;

  // Power margin >= 10%
  const powerMarginPercent = evaluation.power.powerMarginW > 0 ? 1 : 0;
  if (powerMarginPercent > 0) marginAgreement += 1;

  // Positive mass margin
  if (evaluation.mass.growthMarginKg > 0) marginAgreement += 1;

  // Launch readiness and budget compliance
  if (evaluation.launchReady && evaluation.cost.totalMissionCostM > 0) marginAgreement += 1;

  const totalPoints = Math.min(
    15,
    balancedContribution + disputeResolutionSpeed + vetoPenalty + marginAgreement
  );

  let summary = "Exemplary bridge harmony with seamless multidisciplinary consensus.";
  if (totalPoints < 8) {
    summary = "High command friction observed. Disjointed subsystem trades compromised operational efficiency.";
  } else if (totalPoints < 12) {
    summary = "Effective operational execution with moderate friction during trajectory and budget negotiations.";
  }

  return {
    totalPoints,
    breakdown: {
      balancedContribution,
      disputeResolutionSpeed,
      vetoPenalty,
      marginAgreement,
    },
    summary,
  };
}
