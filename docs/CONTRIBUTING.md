# Contributing to MoonLander: Data-Driven Extensibility

MoonLander is designed so that new missions, celestial destinations, hardware parts, and achievements can be added **purely as data** without writing custom React components or altering the core engine.

---

## 1. Adding a New Mission Scenario

Mission scenarios live in `src/data/scenarios.json` and are validated by `ScenarioDataSchema` in `src/data/schemas.ts`.

To add a new scenario:
1. Open `src/data/scenarios.json`.
2. Add an entry to the JSON array:
```json
{
  "id": "enceladus-plume-flyby",
  "title": "Enceladus Geyser Sampler",
  "subtitle": "Cryovolcanic plume organic detection",
  "analogue": "Cassini Enceladus Flyby",
  "briefing": "Fly through the south polar plumes of Enceladus to collect water vapor and prebiotic organic compounds without landing.",
  "targetOrbitId": "saturn-enceladus-resonant",
  "targetLifeYears": 4.0,
  "budgetCapM": 850.0,
  "deadlineMonths": 72,
  "annualOpsCostM": 12.0,
  "recommendedInstruments": [
    "inst-mass-spec",
    "inst-dust-analyzer",
    "inst-thermal-ir"
  ],
  "playable": true,
  "difficulty": "ADVANCED"
}
```
3. Run `npm run typecheck && npm test` to verify schema validation and automatic solvability tests.

---

## 2. Adding a New Celestial Body or Destination

Planetary bodies and orbital destinations live in `src/data/orbits.json` and `src/data/landing-sites.json`.

### A. Orbital Regime (`src/data/orbits.json`)
```json
{
  "id": "uranus-titania-orbit",
  "name": "Titania Polar Mapping Orbit",
  "description": "700 km circular polar orbit around Uranus's largest icy moon.",
  "parentBody": "uranus",
  "perigeeAltKm": 700,
  "apogeeAltKm": 700,
  "inclinationDeg": 89.2,
  "insertionDeltaVKmS": 2.45,
  "stationKeepingDeltaVPerYearMs": 18,
  "deorbitDeltaVMs": 95,
  "eclipseMaxMinutes": 45,
  "solarFluxFactor": 0.037,
  "radiationEnvironment": "high"
}
```

### B. Powered-Descent Landing Site (`src/data/landing-sites.json`)
```json
{
  "id": "titania-messina-chasma",
  "name": "Messina Chasma Ice Canyon",
  "body": "moon",
  "latDeg": -33.3,
  "lonDeg": 335.0,
  "elevationM": -1200,
  "safeRadiusM": 60,
  "targetDescription": "Exposed fresh water ice cliffs along a graben canyon wall.",
  "scienceTargetOffsetM": 140,
  "historicalNotes": "First mapped during Voyager 2's 1986 flyby."
}
```

---

## 3. Adding a New Achievement

Achievements live in `src/data/achievements.json` and are evaluated deterministically by `src/engine/achievements/evaluator.ts`.

Add an entry with a declarative condition:
```json
{
  "id": "deep_space_ice_diver",
  "name": "Ice Diver",
  "description": "Complete any outer-solar-system scenario with over 90% science return on solar power alone.",
  "category": "science",
  "xp": 350,
  "badgeIcon": "snowflake",
  "condition": {
    "type": "scenario_complete",
    "scenarioId": "enceladus-plume-flyby",
    "minScore": 85
  }
}
```

---

## 4. Verification Workflow

Before submitting a Pull Request:
```bash
# 1. Typecheck the entire project
npm run typecheck

# 2. Run unit and property tests
npm test

# 3. Check code style and lint rules
npm run lint

# 4. Verify production build output
npm run build
```
All four checks must pass with **zero errors and zero warnings**.
