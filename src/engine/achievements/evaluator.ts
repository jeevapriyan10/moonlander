/**
 * Pure Deterministic Achievement Evaluation Engine for MoonLander
 * 
 * Evaluates achievement criteria DSL against mission results,
 * debrief telemetry, flight ops logs, and pilot profile statistics.
 */

import type { Achievement } from "@/data";
import type { MissionEvaluation } from "@/engine/evaluate";
import type { DebriefReport } from "@/engine/debrief";
import type { ProfileRecord } from "@/lib/repository/types";

export interface EvaluationContext {
  evaluation?: MissionEvaluation;
  debriefReport?: DebriefReport;
  profile?: ProfileRecord;
  scenarioId?: string;
  isSandbox?: boolean;
  action?: string;
  anomalyResolved?: boolean;
  autopilotUsed?: boolean;
  launchSuccessRoll?: boolean;
  launchProbability?: number;
  distinctDesignsForScenario?: number;
  lessonsCompletedCount?: number;
  codexViewedCount?: number;
  twinsViewedCount?: number;
  campaignChapterId?: string;
  campaignActId?: number;
}

/**
 * Checks whether an achievement's criteria is satisfied by the context.
 */
export function checkAchievement(achievement: Achievement, ctx: EvaluationContext): boolean {
  const criteria = achievement.criteria;
  if (!criteria || !criteria.type) {
    return false;
  }

  switch (criteria.type) {
    case "workspace_opened":
      return ctx.action === "workspace_opened";

    case "design_certified":
      return (
        ctx.action === "design_certified" ||
        (ctx.evaluation !== undefined && ctx.evaluation.validation.filter((v) => v.severity === "error").length === 0)
      );

    case "launch_initiated":
      return ctx.action === "launch_initiated";

    case "orbit_confirmed":
      return ctx.action === "orbit_confirmed";

    case "min_successes":
      if (ctx.profile && ctx.profile.stats.successCount >= (criteria.count ?? 1)) return true;
      if (ctx.debriefReport && ctx.debriefReport.overallScore >= 60) return true;
      return false;

    case "budget_fraction": {
      if (!ctx.evaluation) return false;
      const fraction = ctx.evaluation.cost.totalMissionCostM / ctx.evaluation.cost.budgetCapM;
      return fraction <= (criteria.maxFraction ?? 0.75);
    }

    case "max_dry_mass":
      return ctx.evaluation !== undefined && ctx.evaluation.mass.totalDryMassKg < (criteria.maxKg ?? 150);

    case "lean_margin": {
      if (!ctx.evaluation || !ctx.debriefReport) return false;
      const marginFraction = ctx.evaluation.mass.growthMarginKg / ctx.evaluation.mass.totalDryMassKg;
      return (
        marginFraction <= 0.2 &&
        (ctx.debriefReport.overallGrade === "A" || ctx.debriefReport.overallGrade === "S")
      );
    }

    case "tight_deltav_margin": {
      if (!ctx.evaluation) return false;
      const reqDv = ctx.evaluation.propulsion.breakdown.totalDvRequiredMs;
      const availDv = ctx.evaluation.propulsion.deltaVAvailableMs;
      const excess = (availDv - reqDv) / (reqDv || 1);
      return excess >= 0 && excess <= (criteria.maxMargin ?? 0.05);
    }

    case "propellant_remaining": {
      if (!ctx.evaluation) return false;
      const propFraction = ctx.evaluation.propulsion.propellantMassKg / ctx.evaluation.mass.totalWetMassKg;
      return propFraction <= (criteria.maxFraction ?? 0.02);
    }

    case "power_ratio": {
      if (!ctx.evaluation) return false;
      const ratio = ctx.evaluation.power.sunlitGenerationW / (ctx.evaluation.power.totalLoadW || 1);
      return ratio >= (criteria.minRatio ?? 4.0);
    }

    case "has_cryo_payload": {
      if (!ctx.evaluation) return false;
      return ctx.evaluation.thermal.cryoRequirementMet;
    }

    case "adcs_accuracy": {
      if (!ctx.evaluation) return false;
      const pointing = ctx.evaluation.science.details.pointingAccuracyDeg ?? 0.01;
      return pointing <= (criteria.maxDeg ?? 0.005);
    }

    case "min_data_rate": {
      if (!ctx.evaluation) return false;
      return ctx.evaluation.comms.downlinkCapacityGbPerDay >= (criteria.minMbps ?? 50);
    }

    case "min_instruments": {
      if (!ctx.evaluation) return false;
      return ctx.evaluation.science.instrumentBreakdown.length >= (criteria.count ?? 3);
    }

    case "min_radiation_tolerance": {
      if (!ctx.evaluation) return false;
      return ctx.evaluation.radiation.minTidToleranceKrad >= (criteria.minKrad ?? 100);
    }

    case "eclipse_survived": {
      if (!ctx.evaluation) return false;
      return ctx.evaluation.power.depthOfDischargeUsed <= (criteria.maxDoD ?? 0.6);
    }

    case "storm_rider":
      return (
        ctx.action === "storm_rider_survived" ||
        (ctx.debriefReport !== undefined &&
          ctx.debriefReport.overallScore >= 70 &&
          ctx.evaluation !== undefined &&
          ctx.evaluation.radiation.minTidToleranceKrad >= 50)
      );

    case "temp_range": {
      if (!ctx.evaluation) return false;
      return !ctx.evaluation.thermal.costM;
    }

    case "solar_flux_min": {
      return ctx.action === "solar_flux_survived";
    }

    case "redundant_avionics": {
      if (!ctx.evaluation) return false;
      return ctx.evaluation.risk.score <= 20;
    }

    case "lifetime_years": {
      if (!ctx.evaluation) return false;
      const years = ctx.evaluation.lifetime.projectedLifetimeYears ?? 0;
      return years >= (criteria.minYears ?? 10);
    }

    case "scenario_complete": {
      if (!ctx.debriefReport || ctx.debriefReport.overallScore < 60) return false;
      if (criteria.scenarioId && ctx.scenarioId !== criteria.scenarioId) return false;
      if (criteria.minGrade) {
        if (criteria.minGrade === "S" && ctx.debriefReport.overallGrade !== "S") return false;
        if (criteria.minGrade === "A" && !["A", "S"].includes(ctx.debriefReport.overallGrade)) return false;
      }
      return true;
    }

    case "orbit_regime": {
      return ctx.action === "orbit_regime_reached" || (ctx.scenarioId !== undefined);
    }

    case "lessons_completed":
      return (ctx.lessonsCompletedCount ?? ctx.profile?.stats.lessonsCompleted ?? 0) >= (criteria.count ?? 6);

    case "codex_viewed":
      return (ctx.codexViewedCount ?? 0) >= (criteria.count ?? 10);

    case "twins_viewed":
      return (ctx.twinsViewedCount ?? 0) >= (criteria.count ?? 3);

    case "distinct_designs":
      return (ctx.distinctDesignsForScenario ?? 0) >= (criteria.count ?? 3);

    case "anomaly_resolved":
      return ctx.anomalyResolved === true || ctx.action === "anomaly_resolved";

    case "perfect_insertion":
      return (
        ctx.action === "perfect_insertion" ||
        ((ctx.launchProbability ?? 0) >= 0.98 && ctx.launchSuccessRoll === true)
      );

    case "autopilot_used":
      return ctx.autopilotUsed === true || ctx.action === "autopilot_used";

    case "campaign_chapter":
      return ctx.campaignChapterId === criteria.chapterId;

    case "campaign_act":
      return ctx.campaignActId === criteria.actId;

    case "min_score":
      return ctx.debriefReport !== undefined && ctx.debriefReport.overallScore >= (criteria.score ?? 90);

    case "grade_achieved":
      return ctx.debriefReport !== undefined && ctx.debriefReport.overallGrade === criteria.grade;

    case "rank_achieved":
      return ctx.profile !== undefined && ctx.profile.currentRank === criteria.rank;

    case "sandbox_completed":
      return ctx.isSandbox === true && (ctx.action === "orbit_confirmed" || ctx.debriefReport !== undefined);

    default:
      return false;
  }
}

/**
 * Evaluates all catalog achievements and returns those newly unlocked.
 */
export function evaluateAllAchievements(
  achievements: Achievement[],
  ctx: EvaluationContext,
  alreadyUnlockedIds: string[]
): Achievement[] {
  const unlockedSet = new Set(alreadyUnlockedIds);
  const newlyUnlocked: Achievement[] = [];

  for (const ach of achievements) {
    if (unlockedSet.has(ach.id)) continue;

    if (checkAchievement(ach, ctx)) {
      newlyUnlocked.push(ach);
      unlockedSet.add(ach.id);
    }
  }

  return newlyUnlocked;
}
