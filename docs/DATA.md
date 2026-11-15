# MoonLander Data Architecture & Catalog Specification

This document details the data catalogs, schemas, validation rules, and real-world aerospace analogues used throughout MoonLander (`src/data/`).

All catalog data is stored in structured JSON files, validated at startup and build time via strict Zod schemas (`src/data/schemas.ts`), and loaded through a typed lookup provider (`src/data/index.ts`).

---

## 1. Catalog Inventory

The dataset comprises 8 core catalog categories and an educational glossary:

| Catalog File | Entries | Description | Real-World Analogues |
| :--- | :--- | :--- | :--- |
| `buses.json` | 5 | Structural chassis and bus classes | CubeSat 12U, ESPA Ring Microsat, TESS Smallsat, Landsat Midsize, Flagship Deep-Space Bus |
| `components.json` | 24 | Subsystem components across 7 engineering disciplines | Spectrolab GaAs arrays, Saft Li-ion batteries, Aerojet Rocketdyne thrusters, BAE RAD750, Honeywell reaction wheels |
| `instruments.json` | 8 | Scientific payloads and sensors | OLI multispectral, TIRS thermal IR, WorldView panchromatic, Sentinel-1 SAR, TESS photometer, coronagraph |
| `launchers.json` | 6 | Commercial and government launch vehicles | Rocket Lab Electron, Avio Vega-C, SpaceX Falcon 9, ULA Atlas V 551, SpaceX Falcon Heavy, NASA SLS Block 1 |
| `orbits.json` | 9 | Target orbital destinations and regimes | LEO 500km, SSO 700km, MEO 20200km, GEO 35786km, Molniya HEO, Lunar-resonant HEO, Sun-Earth L1, LLO, LMO |
| `groundNetworks.json` | 3 | Ground tracking and communications services | Dedicated single-dish, Commercial global network (KSAT/AWS), NASA Near Space Network / Deep Space Network |
| `scenarios.json` | 5 | Mission charters (2 Stage 1 playable + 3 Stage 2/3) | Earth Watch (Landsat), Exoplanet Hunter (TESS), Space Weather Sentinel (DSCOVR), Lunar Pathfinder (LRO), Red Planet Relay (MRO) |
| `glossary.json` | 35 | Orbital mechanics and systems engineering terms | Delta-V, Kepler's equation, Tsiolkovsky equation, J2 perturbation, DoD, TRL, Link budget, etc. |

---

## 2. Schema Definitions (`src/data/schemas.ts`)

Every catalog entry is validated with Zod. Type inference guarantees complete type safety (`z.infer<typeof ...>`) without manual duplicate type declarations.

### 2.1 Satellite Bus (`BusSchema`)
```typescript
z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  dryMassKg: z.number().positive(),
  maxDryMassKg: z.number().positive(),
  maxWetMassKg: z.number().positive(),
  maxPayloadMassKg: z.number().positive(),
  diameterM: z.number().positive(),
  baseCostM: z.number().nonnegative(),
  baseScheduleMonths: z.number().positive(),
  minLevel: z.enum(["YOUTH", "INTERMEDIATE", "ADVANCED"]),
})
```

### 2.2 Subsystem Components (`ComponentSchema`)
Subsystem components span 7 disciplines: `solar`, `battery`, `propulsion`, `flight-computer`, `adcs`, `thermal`, `comms`, `storage`.
Each component specifies:
- `massKg`: Structural / equipment mass.
- `powerDrawW`: Standby and active electrical power draw.
- `costM`: Procurement and testing cost in millions USD.
- `trl`: Technology Readiness Level ($1\text{ to }9$).
- `tidToleranceKrad`: Total Ionizing Dose hardness threshold.
- `minLevel`: Minimum game difficulty level required to unlock.
- Specific discipline properties (e.g. `ispSeconds`, `efficiencyPercent`, `pointingAccuracyDeg`, `downlinkRateMbps`).

### 2.3 Scientific Instruments (`InstrumentSchema`)
```typescript
z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    "multispectral", "thermal-ir", "panchromatic", "sar-radar",
    "hyperspectral", "photometer", "spectrograph", "coronagraph"
  ]),
  description: z.string(),
  massKg: z.number().positive(),
  powerW: z.number().positive(),
  dataRateMbps: z.number().positive(),
  nominalDutyCycle: z.number().min(0).max(1),
  requiresCryocooler: z.boolean(),
  baseScienceValue: z.number().positive(),
  costM: z.number().positive(),
  trl: z.number().int().min(1).max(9),
  minLevel: z.enum(["YOUTH", "INTERMEDIATE", "ADVANCED"]),
  // Optical / payload properties
  groundResolutionM: z.number().optional(),
  swathWidthKm: z.number().optional(),
  pointingRequirementDeg: z.number().optional(),
  fieldOfViewDeg2: z.number().optional(),
})
```

### 2.4 Launch Vehicles (`LauncherSchema`)
Launch vehicles define payload lift capacity curves across 6 orbital regimes:
- `payloadLeoKg`: Low Earth Orbit ($200\text{--}500\text{ km}$, $28.5^\circ$)
- `payloadSsoKg`: Sun-Synchronous Orbit ($700\text{ km}$, $98.2^\circ$)
- `payloadGtoKg`: Geostationary Transfer Orbit
- `payloadHeoKg`: High-energy / high-eccentricity orbit
- `payloadTliKg`: Trans-Lunar Injection
- `payloadTmiKg`: Trans-Mars Injection
- `fairingDiameterM`: Usable dynamic payload envelope width.
- `reliability`: Historical track record ($0.88\text{ to }0.985$).
- `costM`: Launch service procurement price.

---

## 3. Real-World Flight Data Analogues

### 3.1 Scenario 1: Earth Watch
- **Analogue:** Landsat 8 / 9 (NASA / USGS)
- **Primary Mission:** Multi-decadal land surface monitoring, wildfire tracking, and agricultural assessment.
- **Flight Baseline:**
  - Orbit: $705\text{ km}$ circular Sun-Synchronous Orbit, $98.2^\circ$ inclination, 10:00 AM descending node.
  - Payloads: Operational Land Imager (OLI, $30\text{ m}$ multispectral) + Thermal Infrared Sensor (TIRS, $100\text{ m}$ dual-band IR with cryocooler).
  - Launch Vehicle: Vega-C or Falcon 9.
  - Downlink: Ka-band ($150\text{--}300\text{ Mbps}$) to commercial global tracking stations (Svalbard, Troll, Sioux Falls).
  - Design Life: $\ge 5\text{ years}$.

### 3.2 Scenario 2: Exoplanet Hunter
- **Analogue:** Transiting Exoplanet Survey Satellite (TESS, NASA / MIT)
- **Primary Mission:** All-sky stellar transit survey monitoring $>200,000$ bright nearby dwarf stars.
- **Flight Baseline:**
  - Orbit: 2:1 Moon-resonant High Earth Orbit ($108,000\text{ km} \times 373,000\text{ km}$, $P = 13.7\text{ days}$).
  - Payloads: Quad wide-field refractive camera photometers ($24^\circ \times 96^\circ = 2300\text{ deg}^2$ field of view).
  - Pointing: Reaction wheels + star trackers achieving $<0.005^\circ$ ($18\text{ arcsec}$) pointing stability.
  - Downlink: Deep Space Network X-band downlink during each perigee passage ($4\text{ hours}$ buffer dump).
  - Design Life: $\ge 2\text{ years}$ (extended to $5+$).

---

## 4. Design Space Feasibility & Validation Benchmarks

To ensure the game is neither trivially solved nor frustratingly impossible, the catalog is balanced such that each scenario possesses:
1. **Multiple Distinct Valid Solutions:** At least 3 structurally different, flight-certified combinations of bus, propulsion, solar arrays, battery, communications, and launchers that meet all requirements within budget and deadline constraints (verified by `src/data/data.test.ts`).
2. **Real Engineering Trade-Offs:**
   - Monopropellant vs Bipropellant vs Hall-effect electric propulsion (mass savings vs schedule transfer penalty).
   - Silicon solar cells vs GaAs Triple-Junction (cost vs array surface area and fairing clearance).
   - Dedicated ground station vs Commercial global network (capital expenditure vs downlink data return fraction).
3. **Difficulty Tiering:**
   - **YOUTH:** Guided catalog with automatic recommendations, hints, and relaxed budgets.
   - **INTERMEDIATE:** Full catalog with realistic NASA mass growth margins and standard cost caps.
   - **ADVANCED:** Strict pointing, deep Van Allen radiation degradation, tight budget caps, and sub-arcsecond ADCS requirements.
