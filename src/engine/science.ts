/**
 * Science Value, Instrument Performance, and Objective Fulfillment engine module.
 *
 * Implements:
 * - Per-instrument scientific return scoring:
 *     InstrumentScore = BaseValue * RequirementFactor * OrbitFitFactor * DataReturnFraction * LifetimeFactor
 *     LifetimeFactor = min(1, actualLife / targetLife)^0.7
 * - Scenario-specific requirement verification:
 *     Earth Watch: ground resolution <= 30m, revisit <= 16 days, life >= 5 yr, return >= 90%
 *     Exoplanet Hunter: FOV >= 2000 deg2, pointing <= 0.01 deg, observing efficiency >= 90%, life >= 2 yr
 * - Detailed score breakdown for Stage 2 causal debriefing and user performance feedback
 */

export interface InstrumentSpec {
  id: string;
  name: string;
  category: "optical" | "ir" | "radar" | "photometer" | "spectrometer" | "field";
  baseScienceValue: number;
  massKg: number;
  avgPowerW: number;
  peakPowerW: number;
  dataRateMbps: number;
  maxDutyCycle: number;
  costM: number;
  trl: number;
  requiresCryo: boolean;
  requiredPointingDeg: number;
  // Specific sensor optical parameters
  referenceAltitudeKm?: number;
  referenceSwathKm?: number;
  referenceResolutionM?: number;
  fieldOfViewDeg2?: number;
  spectralBands?: number;
}

export interface InstrumentScoreItem {
  instrumentId: string;
  instrumentName: string;
  baseValue: number;
  orbitFitFactor: number;
  orbitFitReason: string;
  requirementFactor: number;
  dataReturnFraction: number;
  lifetimeFactor: number;
  finalScore: number;
}

export interface ScienceEvaluation {
  totalScienceScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  grade: "S" | "A" | "B" | "C" | "F";
  instrumentBreakdown: InstrumentScoreItem[];
  requirementsSummary: {
    totalRequirements: number;
    metRequirements: number;
    allRequirementsMet: boolean;
  };
  details: {
    groundResolutionM?: number;
    revisitDays?: number;
    fieldOfViewDeg2?: number;
    pointingAccuracyDeg?: number;
    observingEfficiencyPercent?: number;
  };
}

/**
 * Orbit fit factor for specific scenarios:
 * E.g., Exoplanet transit photometers in LEO suffer from Earth occultation and high thermal cycling
 * (efficiency ~0.55), while in Lunar-resonant HEO or L1 they achieve ~0.95 continuous viewing.
 */
export function getOrbitFitFactor(
  scenarioId: string,
  orbitId: string,
  altitudeKm: number
): { factor: number; reason: string } {
  if (scenarioId === "earth-watch") {
    // Earth watch requires low Earth observation; SSO is optimal for consistent solar lighting
    if (orbitId === "sso-700") {
      return { factor: 1.0, reason: "Sun-synchronous orbit provides identical solar illumination across revisits." };
    }
    if (orbitId === "leo-500") {
      return { factor: 0.85, reason: "Mid-inclination LEO causes drifting illumination angles across seasons." };
    }
    if (altitudeKm > 1500) {
      return { factor: 0.2, reason: "High altitude severely degrades optical spatial resolution for land monitoring." };
    }
    return { factor: 0.7, reason: "Sub-optimal orbital geometry for routine Earth land surface imaging." };
  }

  if (scenarioId === "exoplanet-hunter") {
    // Transit photometer requires continuous, undisturbed photometric monitoring
    if (orbitId === "heo-tess" || orbitId === "l1-halo") {
      return {
        factor: 1.0,
        reason: "Lunar-resonant HEO / L1 orbit escapes Earth occultation with >90% continuous photometric duty cycle.",
      };
    }
    if (orbitId === "geo-35786") {
      return {
        factor: 0.8,
        reason: "GEO provides long sightlines but suffers from daily Earth occultation and thermal variations.",
      };
    }
    if (orbitId === "leo-500" || orbitId === "sso-700") {
      return {
        factor: 0.55,
        reason: "LEO causes heavy Earth occultation, high scattered light, and severe thermal cycling (~55% viewing efficiency).",
      };
    }
    return { factor: 0.65, reason: "Moderate photometric stability and observing duty." };
  }

  return { factor: 1.0, reason: "Nominal orbital operating conditions." };
}

/**
 * Evaluates scientific return and requirement fulfillment for the mission.
 */
export function evaluateScience(
  scenarioId: string,
  instruments: InstrumentSpec[],
  orbitId: string,
  altitudeKm: number,
  actualLifeYears: number,
  targetLifeYears: number,
  dataReturnFraction: number,
  adcsPointingDeg: number,
  scaledResolutionM?: number,
  revisitDays?: number
): ScienceEvaluation {
  let totalScore = 0;
  let maxPossibleScore = 0;
  const instrumentBreakdown: InstrumentScoreItem[] = [];

  // Lifetime factor: min(1, actualLife / targetLife)^0.7
  const lifetimeRatio = targetLifeYears > 0 ? Math.min(1.0, actualLifeYears / targetLifeYears) : 1.0;
  const lifetimeFactor = Math.pow(lifetimeRatio, 0.7);

  // Orbit fit factor
  const orbitFit = getOrbitFitFactor(scenarioId, orbitId, altitudeKm);

  // Requirements fulfillment
  let totalRequirements = 0;
  let metRequirements = 0;

  let totalFovDeg2 = 0;
  let hasMetPointing = true;

  for (const inst of instruments) {
    if (inst.fieldOfViewDeg2) {
      totalFovDeg2 += inst.fieldOfViewDeg2;
    }
    if (adcsPointingDeg > inst.requiredPointingDeg) {
      hasMetPointing = false;
    }
  }

  let requirementFactor = 1.0;

  if (scenarioId === "earth-watch") {
    // Requirements:
    // 1. Resolution <= 30m
    totalRequirements++;
    const resOk = (scaledResolutionM ?? 999) <= 30;
    if (resOk) metRequirements++;

    // 2. Revisit <= 16 days
    totalRequirements++;
    const revOk = (revisitDays ?? 999) <= 16;
    if (revOk) metRequirements++;

    // 3. Design life >= 5 yr
    totalRequirements++;
    const lifeOk = actualLifeYears >= targetLifeYears;
    if (lifeOk) metRequirements++;

    // 4. Data return >= 90%
    totalRequirements++;
    const dataOk = dataReturnFraction >= 0.9;
    if (dataOk) metRequirements++;

    // 5. Pointing accuracy
    totalRequirements++;
    if (hasMetPointing) metRequirements++;

    requirementFactor = metRequirements / totalRequirements;
  } else if (scenarioId === "exoplanet-hunter") {
    // Requirements:
    // 1. Total FOV >= 2000 deg2
    totalRequirements++;
    const fovOk = totalFovDeg2 >= 2000;
    if (fovOk) metRequirements++;

    // 2. Pointing <= 0.01 deg
    totalRequirements++;
    const pointOk = adcsPointingDeg <= 0.01;
    if (pointOk) metRequirements++;

    // 3. Observing efficiency >= 90%
    totalRequirements++;
    const obsEff = orbitFit.factor >= 0.9;
    if (obsEff) metRequirements++;

    // 4. Design life >= 2 yr
    totalRequirements++;
    const lifeOk = actualLifeYears >= targetLifeYears;
    if (lifeOk) metRequirements++;

    // 5. Data return >= 90%
    totalRequirements++;
    const dataOk = dataReturnFraction >= 0.9;
    if (dataOk) metRequirements++;

    requirementFactor = metRequirements / totalRequirements;
  } else {
    totalRequirements = 1;
    metRequirements = 1;
    requirementFactor = 1.0;
  }

  for (const inst of instruments) {
    const baseValue = inst.baseScienceValue;
    maxPossibleScore += baseValue;

    const itemScore = Math.round(
      baseValue * orbitFit.factor * requirementFactor * dataReturnFraction * lifetimeFactor * 10
    ) / 10;

    totalScore += itemScore;

    instrumentBreakdown.push({
      instrumentId: inst.id,
      instrumentName: inst.name,
      baseValue,
      orbitFitFactor: orbitFit.factor,
      orbitFitReason: orbitFit.reason,
      requirementFactor,
      dataReturnFraction,
      lifetimeFactor: Math.round(lifetimeFactor * 100) / 100,
      finalScore: itemScore,
    });
  }

  const percentageScore =
    maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  let grade: ScienceEvaluation["grade"] = "F";
  if (percentageScore >= 90 && metRequirements === totalRequirements) grade = "S";
  else if (percentageScore >= 80) grade = "A";
  else if (percentageScore >= 65) grade = "B";
  else if (percentageScore >= 50) grade = "C";

  return {
    totalScienceScore: Math.round(totalScore * 10) / 10,
    maxPossibleScore,
    percentageScore,
    grade,
    instrumentBreakdown,
    requirementsSummary: {
      totalRequirements,
      metRequirements,
      allRequirementsMet: metRequirements === totalRequirements,
    },
    details: {
      groundResolutionM: scaledResolutionM,
      revisitDays,
      fieldOfViewDeg2: totalFovDeg2,
      pointingAccuracyDeg: adcsPointingDeg,
      observingEfficiencyPercent: Math.round(orbitFit.factor * 100),
    },
  };
}
