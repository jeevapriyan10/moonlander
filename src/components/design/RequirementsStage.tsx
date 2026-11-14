"use client";

import React from "react";
import { useMissionStore } from "@/store/mission";
import { useUIStore } from "@/store/ui";
import { scenarios } from "@/data";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";

export const RequirementsStage: React.FC = () => {
  const { currentMission, evaluation } = useMissionStore();
  const { setCurrentStage, unlockStage } = useUIStore();

  const scenario =
    scenarios.find((s) => s.id === currentMission.scenarioId) ?? scenarios[0]!;

  const handleProceed = () => {
    unlockStage(3);
    setCurrentStage(3);
  };

  const isEarthWatch = currentMission.scenarioId === "earth-watch";

  const requirementsTable = isEarthWatch
    ? [
        {
          name: "Ground Spatial Resolution",
          limit: "<= 30.0 m",
          actual: evaluation.orbit.scaledResolutionM !== undefined ? `${evaluation.orbit.scaledResolutionM.toFixed(1)} m` : "Pending Payload",
          met: (evaluation.orbit.scaledResolutionM ?? 999) <= 30,
          rationale: "Required to discriminate individual crop parcels, wildfire burn scars, and timber clearcuts.",
        },
        {
          name: "Global Surface Revisit Time",
          limit: "<= 16.0 days",
          actual: evaluation.orbit.revisitDays !== undefined ? `${evaluation.orbit.revisitDays.toFixed(1)} days` : "Pending Orbit",
          met: (evaluation.orbit.revisitDays ?? 999) <= 16,
          rationale: "Ensures frequent seasonal land-use updates and regular tracking of vegetation recovery.",
        },
        {
          name: "Operational Mission Life",
          limit: ">= 5.0 years",
          actual: `${evaluation.lifetime.projectedLifetimeYears.toFixed(1)} years`,
          met: evaluation.lifetime.projectedLifetimeYears >= 5.0,
          rationale: "Amortizes large space hardware capital costs over a multi-year land inventory campaign.",
        },
        {
          name: "Daily Science Data Return",
          limit: ">= 90%",
          actual: `${(evaluation.comms.dataReturnFraction * 100).toFixed(0)}%`,
          met: evaluation.comms.dataReturnFraction >= 0.9,
          rationale: "Prevents scientific data backlog and recorder overflow during orbital observation runs.",
        },
        {
          name: "Lifecycle Cost within Budget Cap",
          limit: `< $${scenario.budgetCapM.toFixed(1)}M`,
          actual: `$${evaluation.cost.totalMissionCostM.toFixed(1)}M`,
          met: evaluation.cost.withinBudget,
          rationale: "Fiscal ceiling authorized under NASA Earth Science Division project charter.",
        },
      ]
    : [
        {
          name: "Combined Field of View",
          limit: ">= 2,000 deg²",
          actual: `${evaluation.science.details.fieldOfViewDeg2 ?? 0} deg²`,
          met: (evaluation.science.details.fieldOfViewDeg2 ?? 0) >= 2000,
          rationale: "Massive celestial sky coverage is needed to survey millions of bright nearby stars for transits.",
        },
        {
          name: "Boresight Pointing Stability",
          limit: "<= 0.01°",
          actual: `${evaluation.science.details.pointingAccuracyDeg ?? 1.0}°`,
          met: (evaluation.science.details.pointingAccuracyDeg ?? 1.0) <= 0.01,
          rationale: "Sub-arcminute image stability avoids inter-pixel stellar centroid jitter and false transit dips.",
        },
        {
          name: "Observing Viewing Efficiency",
          limit: ">= 90%",
          actual: `${evaluation.science.details.observingEfficiencyPercent ?? 0}%`,
          met: (evaluation.science.details.observingEfficiencyPercent ?? 0) >= 90,
          rationale: "Minimizes Earth shadow occultation, thermal swings, and scattered stray light.",
        },
        {
          name: "Operational Design Life",
          limit: ">= 2.0 years",
          actual: `${evaluation.lifetime.projectedLifetimeYears.toFixed(1)} years`,
          met: evaluation.lifetime.projectedLifetimeYears >= 2.0,
          rationale: "Required to complete survey sweeps across both Northern and Southern ecliptic hemispheres.",
        },
        {
          name: "Lifecycle Cost within Budget Cap",
          limit: `< $${scenario.budgetCapM.toFixed(1)}M`,
          actual: `$${evaluation.cost.totalMissionCostM.toFixed(1)}M`,
          met: evaluation.cost.withinBudget,
          rationale: "Astrophysics Explorer Class cost cap mandated under program guidelines.",
        },
      ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-1 border-b border-space-border pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="amber" size="sm">
            STAGE 02 : REQUIREMENTS MATRIX
          </Badge>
          <Badge variant="info" size="sm">
            {scenario.title}
          </Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-heading uppercase tracking-widest text-white font-bold">
          System Engineering Verification Matrix
        </h1>
        <p className="text-xs font-mono text-gray-400">
          Every requirement must be validated by the simulation engine before final flight readiness certification.
        </p>
      </div>

      <Panel
        title={
          <span className="flex items-center gap-2 text-gray-200">
            <ShieldCheck className="w-4 h-4 text-telemetry-green" />
            <span>Formal Compliance Verification</span>
          </span>
        }
        bodyClassName="p-0 overflow-x-auto"
      >
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-space-border bg-black/40 text-[11px] font-heading uppercase tracking-wider text-gray-400">
              <th className="p-3">Requirement</th>
              <th className="p-3">Certified Limit</th>
              <th className="p-3">Current Design</th>
              <th className="p-3">Status</th>
              <th className="p-3 hidden md:table-cell">Engineering Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-space-border/50">
            {requirementsTable.map((req, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="p-3 font-medium text-gray-200 font-heading uppercase tracking-wider">
                  {req.name}
                </td>
                <td className="p-3 text-telemetry-cyan font-bold">{req.limit}</td>
                <td className="p-3 text-gray-300 font-bold">{req.actual}</td>
                <td className="p-3">
                  {req.met ? (
                    <Badge variant="nominal" size="sm">
                      <CheckCircle2 className="w-3 h-3 text-telemetry-green" />
                      <span>Compliant</span>
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      <AlertCircle className="w-3 h-3 text-telemetry-orange" />
                      <span>Pending</span>
                    </Badge>
                  )}
                </td>
                <td className="p-3 text-gray-400 text-[11px] hidden md:table-cell">
                  {req.rationale}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="flex items-center justify-between pt-2">
        <Button
          size="md"
          variant="outline"
          onClick={() => setCurrentStage(1)}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Objective</span>
        </Button>

        <Button
          size="lg"
          variant="primary"
          onClick={handleProceed}
          className="flex items-center gap-2"
        >
          <span>Acknowledge & Begin Spacecraft Design</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

