import { z } from "zod";

export const DifficultyLevelSchema = z.enum(["YOUTH", "INTERMEDIATE", "ADVANCED"]);

export const BusClassDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  explain: z.string(),
  basis: z.string(),
  minLevel: DifficultyLevelSchema,
  structuralMassKg: z.number().positive(),
  maxDryMassKg: z.number().positive(),
  diameterM: z.number().positive(),
  baseCostM: z.number().nonnegative(),
  baseScheduleMonths: z.number().positive(),
  defaultPointingDeg: z.number().positive(),
});

export const SolarArrayDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  explain: z.string(),
  basis: z.string(),
  minLevel: DifficultyLevelSchema,
  type: z.enum(["silicon", "gaas-triple"]),
  efficiency: z.number().positive(),
  massPerM2Kg: z.number().positive(),
  costPerM2M: z.number().positive(),
  annualDegradation: z.number().positive(),
  trl: z.number().min(1).max(9),
});

export const BatteryDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  explain: z.string(),
  basis: z.string(),
  minLevel: DifficultyLevelSchema,
  type: z.enum(["li-ion-standard", "li-ion-advanced"]),
  specificEnergyWhKg: z.number().positive(),
  costPerKWhM: z.number().positive(),
  ratedCyclesAt30DoD: z.number().positive(),
  trl: z.number().min(1).max(9),
});

export const PropulsionDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  explain: z.string(),
  basis: z.string(),
  minLevel: DifficultyLevelSchema,
  type: z.enum(["cold-gas", "monoprop", "biprop", "electric-hall"]),
  ispSeconds: z.number().positive(),
  dryMassKg: z.number().nonnegative(),
  powerW: z.number().nonnegative(),
  thrustN: z.number().positive(),
  costM: z.number().nonnegative(),
  trl: z.number().min(1).max(9),
});

export const FlightComputerDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  explain: z.string(),
  basis: z.string(),
  minLevel: DifficultyLevelSchema,
  tidToleranceKrad: z.number().positive(),
  powerW: z.number().positive(),
  massKg: z.number().positive(),
  costM: z.number().nonnegative(),
  trl: z.number().min(1).max(9),
});

export const AdcsDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  explain: z.string(),
  basis: z.string(),
  minLevel: DifficultyLevelSchema,
  pointingAccuracyDeg: z.number().positive(),
  massKg: z.number().positive(),
  powerW: z.number().positive(),
  costM: z.number().nonnegative(),
  trl: z.number().min(1).max(9),
});

export const ThermalDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  explain: z.string(),
  basis: z.string(),
  minLevel: DifficultyLevelSchema,
  type: z.enum(["passive", "heat-pipes", "cryocooler"]),
  massFraction: z.number().positive(),
  heaterPowerW: z.number().nonnegative(),
  coolerPowerW: z.number().nonnegative(),
  costM: z.number().nonnegative(),
  trl: z.number().min(1).max(9),
  supportsCryoIR: z.boolean(),
});

export const CommsDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  explain: z.string(),
  basis: z.string(),
  minLevel: DifficultyLevelSchema,
  band: z.enum(["S-band", "X-band", "Ka-band", "optical-laser"]),
  downlinkRateMbps: z.number().positive(),
  rfPowerW: z.number().positive(),
  dcPowerW: z.number().positive(),
  massKg: z.number().positive(),
  costM: z.number().nonnegative(),
  trl: z.number().min(1).max(9),
  isDeepSpaceHGA: z.boolean(),
});

export const StorageDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  explain: z.string(),
  basis: z.string(),
  minLevel: DifficultyLevelSchema,
  capacityGb: z.number().positive(),
  costM: z.number().nonnegative(),
  massKg: z.number().positive(),
  trl: z.number().min(1).max(9),
});

export const InstrumentDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  explain: z.string(),
  basis: z.string(),
  minLevel: DifficultyLevelSchema,
  category: z.enum(["optical", "ir", "radar", "photometer", "spectrometer", "field"]),
  baseScienceValue: z.number().positive(),
  massKg: z.number().positive(),
  avgPowerW: z.number().positive(),
  peakPowerW: z.number().positive(),
  dataRateMbps: z.number().positive(),
  maxDutyCycle: z.number().min(0).max(1),
  costM: z.number().positive(),
  trl: z.number().min(1).max(9),
  requiresCryo: z.boolean(),
  requiredPointingDeg: z.number().positive(),
  referenceAltitudeKm: z.number().positive().optional(),
  referenceSwathKm: z.number().positive().optional(),
  referenceResolutionM: z.number().positive().optional(),
  fieldOfViewDeg2: z.number().positive().optional(),
  spectralBands: z.number().positive().optional(),
});

export const LauncherDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  explain: z.string(),
  basis: z.string(),
  minLevel: DifficultyLevelSchema,
  manufacturer: z.string(),
  capacityKg: z.object({
    leo: z.number().positive().nullable(),
    sso: z.number().positive().nullable(),
    gto: z.number().positive().nullable(),
    tli: z.number().positive().nullable(),
    tmi: z.number().positive().nullable(),
  }),
  priceM: z.number().positive(),
  fairingDiameterM: z.number().positive(),
  reliability: z.number().min(0.5).max(1.0),
  firstFlightYear: z.number().int(),
  stages: z.number().int().positive(),
});

export const OrbitDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  explain: z.string(),
  basis: z.string(),
  minLevel: DifficultyLevelSchema,
  regime: z.enum(["LEO", "SSO", "MEO", "GEO", "HEO", "L1", "L2", "LUNAR", "SURFACE", "MARS", "JUPITER"]),
  launcherClassNeeded: z.enum(["leo", "sso", "gto", "tli", "tmi"]),
  perigeeAltKm: z.number().nonnegative(),
  apogeeAltKm: z.number().nonnegative(),
  inclinationDeg: z.number().min(0).max(180),
  insertionDvMs: z.number().nonnegative(),
  stationKeepingPerYearMs: z.number().nonnegative(),
  deorbitDisposalMs: z.number().nonnegative(),
  solarFluxW_M2: z.number().positive(),
  annualSolarDegradation: z.number().positive(),
  distanceFromEarthKm: z.number().nonnegative(),
  defaultBetaAngleDeg: z.number().nonnegative(),
  description: z.string(),
  commsNotes: z.string(),
  radiationNotes: z.string(),
});

export const GroundNetworkDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  explain: z.string(),
  basis: z.string(),
  minLevel: DifficultyLevelSchema,
  type: z.enum(["dedicated", "commercial", "dsn-nsn"]),
  stationCount: z.number().int().positive(),
  contactMinutesPerDayLEO: z.number().nonnegative(),
  continuousGEO: z.boolean(),
  costPerPassM: z.number().nonnegative(),
  annualOpsCostM: z.number().nonnegative(),
  deepSpaceSupport: z.boolean(),
  referenceDistanceKm: z.number().positive(),
});

export const ScenarioDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  analogue: z.string(),
  briefing: z.string(),
  targetOrbitId: z.string(),
  targetLifeYears: z.number().positive(),
  budgetCapM: z.number().positive(),
  deadlineMonths: z.number().positive(),
  annualOpsCostM: z.number().positive(),
  recommendedInstruments: z.array(z.string()),
  playable: z.boolean(),
  difficulty: DifficultyLevelSchema,
  minLevel: DifficultyLevelSchema,
  requirementsList: z.array(z.string()),
  realWorldContext: z.string(),
});

export const GlossaryTermSchema = z.object({
  id: z.string(),
  term: z.string(),
  shortDefinition: z.string(),
  fullExplanation: z.string(),
  category: z.enum([
    "orbits",
    "propulsion",
    "power",
    "comms",
    "thermal",
    "systems",
    "payload",
  ]),
  formula: z.string().optional(),
});

export const CodexCategorySchema = z.enum([
  "subsystems",
  "orbits",
  "environment",
  "operations",
  "real-missions",
  "physics",
]);

export const CodexEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  plainLanguageName: z.string().optional(),
  category: CodexCategorySchema,
  summary: z.string(),
  technicalDefinition: z.string(),
  historicalExample: z.string(),
  gameplayImpact: z.string(),
  formula: z.string().optional(),
  diagramUrl: z.string().optional(),
  externalUrl: z.string().optional(),
  relatedIds: z.array(z.string()).default([]),
});

export const DestinationDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  bodyId: z.string(),
  category: z.enum(["terrestrial", "lagrange", "lunar", "interplanetary", "outer-system"]),
  distanceAU: z.number().nonnegative(),
  typicalDeltaVKmS: z.number().positive(),
  oneWayLightTimeMinutes: z.number().nonnegative(),
  solarFluxW_M2: z.number().positive(),
  blackbodyTempK: z.number().positive(),
  radiationEnvironment: z.string(),
  description: z.string(),
  scienceGoals: z.array(z.string()),
  historicMissions: z.array(z.string()),
  defaultOrbitId: z.string(),
});

export const ExoplanetDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  hostStar: z.string(),
  spectralType: z.string(),
  distanceLightYears: z.number().positive(),
  discoveryYear: z.number().int().positive(),
  discoveryFacility: z.string(),
  orbitalPeriodDays: z.number().positive(),
  semiMajorAxisAU: z.number().positive(),
  radiusEarthRadii: z.number().positive(),
  massEarthMasses: z.number().positive().optional(),
  transitDepthPpm: z.number().positive(),
  equilibriumTempK: z.number().positive(),
  habitableZoneStatus: z.enum(["optimistic", "conservative", "non-habitable"]),
  atmosphereSignatures: z.array(z.string()),
  scientificSignificance: z.string(),
});

export const SpaceWeatherDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  cmeSpeedKmS: z.number().positive(),
  kpIndex: z.number().min(0).max(9),
  dstIndexNt: z.number(),
  solarProtonFluxPfu: z.number().positive(),
  flareClass: z.string(),
  historicalImpact: z.string(),
  spacecraftCountermeasures: z.array(z.string()),
});

export const RealMissionDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  agency: z.string(),
  launchYear: z.number().int().positive(),
  missionStatus: z.enum(["operational", "completed", "en-route", "lost"]),
  scenarioId: z.string(),
  launchMassKg: z.number().positive(),
  totalCostM: z.number().positive(),
  primaryOrbit: z.string(),
  primaryPayloads: z.array(z.string()),
  keyDiscoveries: z.array(z.string()),
  lessonsLearned: z.string(),
  nasaArchiveUrl: z.string().url(),
});

export const AchievementCategorySchema = z.enum([
  "first-flight",
  "engineering",
  "efficiency",
  "survival",
  "exploration",
  "learning",
  "story",
  "destinations",
  "operations",
  "mastery",
]);

export const AchievementTierSchema = z.enum(["bronze", "silver", "gold", "platinum"]);

export const AchievementDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: AchievementCategorySchema,
  tier: AchievementTierSchema.default("bronze"),
  xp: z.number().int().positive(),
  secret: z.boolean().default(false),
  badgeIcon: z.string(),
  unlockRequirement: z.string(),
  criteria: z.record(z.any()).optional(),
});

export const LandingSiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  body: z.enum(["moon", "mars"]),
  latDeg: z.number(),
  lonDeg: z.number(),
  elevationM: z.number(),
  safeRadiusM: z.number().positive(),
  scienceTargetOffsetM: z.number().positive().optional(),
  targetDescription: z.string(),
  historicalNotes: z.string().optional(),
});
