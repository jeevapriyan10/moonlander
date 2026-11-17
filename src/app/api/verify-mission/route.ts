import { NextResponse } from "next/server";
import { evaluateMission, type MissionDesignConfig } from "@/engine/evaluate";
import { createCatalogLookup } from "@/data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface VerifyMissionPayload {
  design: MissionDesignConfig;
  score: number;
  callsign?: string;
  userId?: string;
  claimedMetrics?: {
    totalCostM?: number;
    deltaVMs?: number;
    finalMassKg?: number;
  };
}

export async function POST(request: Request) {
  try {
    const body: VerifyMissionPayload = await request.json();

    if (!body || !body.design || typeof body.score !== "number") {
      return NextResponse.json(
        { verified: false, error: "Missing design configuration or score." },
        { status: 400 }
      );
    }

    const { design, score, callsign, userId, claimedMetrics } = body;
    const catalog = createCatalogLookup();

    // 1. Deterministic Server-Side Simulation
    const evalRes = evaluateMission(design, catalog);
    const fatalErrors = evalRes.validation.filter((v) => v.severity === "error");

    if (fatalErrors.length > 0 || !evalRes.launchReady) {
      return NextResponse.json(
        {
          verified: false,
          error: "Deterministic simulation rejected design configuration.",
          details: fatalErrors.map((e) => e.message),
        },
        { status: 422 }
      );
    }

    // 2. Metrics Verification (detect tampered cost or delta-v)
    if (claimedMetrics?.totalCostM !== undefined) {
      const costDelta = Math.abs(claimedMetrics.totalCostM - evalRes.cost.totalMissionCostM);
      if (costDelta > 1.0) {
        return NextResponse.json(
          {
            verified: false,
            error: `Submitted cost ($${claimedMetrics.totalCostM}M) deviates from verified physics engine cost ($${evalRes.cost.totalMissionCostM}M).`,
          },
          { status: 422 }
        );
      }
    }

    if (claimedMetrics?.deltaVMs !== undefined) {
      const dvDelta = Math.abs(claimedMetrics.deltaVMs - evalRes.propulsion.deltaVAvailableMs);
      if (dvDelta > 50.0) {
        return NextResponse.json(
          {
            verified: false,
            error: `Submitted delta-v (${claimedMetrics.deltaVMs} m/s) deviates from verified rocket equation (${evalRes.propulsion.deltaVAvailableMs} m/s).`,
          },
          { status: 422 }
        );
      }
    }

    // 3. Optional Leaderboard Persistence if Server Client Available
    let leaderboardEntryId: string | null = null;
    const serverSupabase = getSupabaseServerClient();

    if (serverSupabase && userId && callsign) {
      try {
        const { data, error } = await serverSupabase
          .from("leaderboard_entries")
          .insert({
            user_id: userId,
            callsign,
            scenario_id: design.scenarioId,
            score,
            metrics: {
              costM: evalRes.cost.totalMissionCostM,
              massKg: evalRes.mass.totalWetMassKg,
              deltaVMs: evalRes.propulsion.deltaVAvailableMs,
              powerMarginW: evalRes.power.powerMarginW,
            },
            verified: true,
          })
          .select("id")
          .single();

        if (!error && data) {
          leaderboardEntryId = data.id;
        }
      } catch (err) {
        console.warn("[verify-mission] Leaderboard write skipped:", err);
      }
    }

    return NextResponse.json({
      verified: true,
      score,
      leaderboardEntryId,
      verifiedMetrics: {
        totalCostM: evalRes.cost.totalMissionCostM,
        wetMassKg: evalRes.mass.totalWetMassKg,
        deltaVAvailableMs: evalRes.propulsion.deltaVAvailableMs,
        powerMarginW: evalRes.power.powerMarginW,
        launchReady: evalRes.launchReady,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        verified: false,
        error: "Internal verification engine fault",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
