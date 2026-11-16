# MOONLANDER 
[![CI](https://github.com/jeevapriyan10/moonlander/actions/workflows/ci.yml/badge.svg)](https://github.com/jeevapriyan10/moonlander/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%20noUncheckedIndexedAccess-blue)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F%20%2B%20Drei-orange)](https://docs.pmnd.rs/react-three-fiber)

> **Every mission begins with a decision.** Where Kerbal Space Program's planning depth meets NASA mission-control aesthetics.

**MoonLander** is a premium browser-based space mission simulation game where players architect, balance, launch, and operate deep-space missions. Every subsystem—from solar flux and battery depth-of-discharge to Tsiolkovsky delta-v budgets and Keplerian orbit propagation—is backed by real-world astrodynamics and systems engineering physics.

---

## Stage 1 Capabilities & Features

- **High-Fidelity Aerospace Engine (`src/engine/`):**
  - Pure TypeScript with zero React or Three.js dependencies.
  - Astrodynamic mechanics: Keplerian 2-body orbit propagation, Newton-Raphson Kepler solver ($<10^{-12}$ tolerance), Sun-synchronous nodal precession via $J_2$, eclipse geometry, and ground station pass contact angles.
  - Subsystem physics: Tsiolkovsky rocket equation, solar array generation with cosine losses and annual degradation, battery sizing with orbital regime DoD limits (LEO 30%, HEO 50%, GEO 60%), RF downlink link budgets, and total ionizing dose (TID) radiation wear.
  - Real-time $<5\text{ ms}$ evaluation pipeline returning complete telemetry rollups and structured causes.
- **Flight Data Catalogs (`src/data/`):**
  - 5 satellite buses (CubeSat 12U to Flagship Deep-Space).
  - 24 subsystem components across 7 disciplines.
  - 8 scientific payloads (multispectral, thermal IR, SAR radar, transit photometer, coronagraph, etc.).
  - 6 launch vehicles (Electron, Vega-C, Falcon 9, Atlas V 551, Falcon Heavy, SLS Block 1).
  - 9 orbital regimes with realistic Delta-V insertion, station-keeping, and disposal budgets.
  - Runtime validation using strict Zod schemas (`src/data/schemas.ts`).
- **Interactive 3D Viewport (`src/components/three/`):**
  - Procedural spacecraft model featuring gold Multi-Layer Insulation (MLI), deployable solar wings, parabolic comms dishes, laser turrets, thruster bells, and Hall ion engines.
  - Realistic Earth rendering with day/night terminator, atmospheric Fresnel glow shader, rotating clouds, and procedural canvas fallbacks.
  - Trajectory viewer displaying 3D Keplerian orbital ellipses, satellite velocity vectors, Earth shadow cones, and ground station visibility cones.
  - Dynamic 3D launch sequence with engine ignition, staging, fairing separation, camera chase angles, and telemetry overlays.
  - Dynamic imports (`ssr: false`) and automatic WebGL error boundary fallbacks.
- **Mission Control Design System (`src/components/ui/`):**
  - Deep-space editorial palette: `#05070D` near-black navy, `#0B1020` panels, 1px hairline borders (`#1B2440`), and high-contrast telemetry accents.
  - Typography: Barlow Condensed (headings), Inter Tight (body), JetBrains Mono (telemetry).
  - Live resource dashboard: Mass (dry/wet/growth), Power (margin/DoD), Economics (cost/cap), Comms (downlink/return rate), Schedule, and Risk.
  - Mission Systems Advisor with "Why" physics explanations and machine-applicable "Apply Fix" buttons.
- **Playable Flight Campaigns:**
  - **Earth Watch (Landsat 8/9 Analogue):** Multi-spectral land and wildfire monitor in 705 km Sun-Synchronous Orbit.
  - **Exoplanet Hunter (TESS Analogue):** Wide-field stellar transit surveyor in 2:1 lunar-resonant High Earth Orbit.
  - 3 Stage 2/3 expansion profiles (Space Weather Sentinel, Lunar Pathfinder, Red Planet Relay) defined in schema.
- **Full 6-Stage Campaign Flow:**
  - 1. Objective Charter $\to$ 2. Requirements Compliance Matrix $\to$ 3. Design Workspace $\to$ 4. Orbit & Launch Sequence $\to$ 5. Orbital Operations (Stage 2 preview) $\to$ 6. Science Performance Debrief (Letter grades S/A/B/C/F).
- **Persistence & Sharing:**
  - Versioned localStorage persistence via Zustand.
  - JSON configuration export/import.
  - Compressed URL share codes (`MF-XXXX-XX`).
- **Orbital Systems Lexicon (`/learn`):**
  - 35 searchable aerospace terms with canonical formulas and plain-language engineering explanations.

---

## Stage 2 Capabilities & Features (Completed)

- **Phase A: Rebranding & Audit Hardening**
  - Unified **MoonLander** brand identity, Barlow Condensed wordmark, original crescent/lander vector insignia, and `moonlander:*` storage namespace.
  - Automatic legacy migration shim preserving existing local saves.
  - Bulletproof hydration gating (`useHasHydrated`), URL query sync (`?stage=...`), and WebGL context-loss recovery.
- **Phase B: Learn-to-Play System & Space Codex**
  - Interactive onboarding flow with experience presets (Cadet, Flight Controller, Aerospace Architect).
  - **Space Academy (`/academy`):** 6 interactive playable mini-lessons covering Orbit Mechanics, Power Budgets, Propulsion, Thermal Balance, Comms Links, and System Integration.
  - **CAPCOM Coach:** Progressive 3-level hint guidance (Observation -> Guidance -> Direct Fix).
  - **Space Codex (`/codex`):** 92 searchable aerospace engineering topics with formulas and flight applications.
  - **Auto-Design Engine:** Constraint satisfaction solver and Mission Systems Advisor "Fix All" capability.
- **Phase C: Astrodynamics & Interplanetary Engine**
  - Universal-Variable Lambert Solver converging to sub-minute transfer orbits via finite-difference root finding.
  - Standish planetary ephemeris (1800-2050 AD) and porkchop transfer plot visualization.
  - 8 Playable Destinations (LEO, SSO, GEO, L1, L2, Lunar Orbit, Lunar Surface, Mars, Europa).
  - NASA Exoplanet Archive and DONKI historical space weather event datasets.
  - 3D Interactive Solar System View with planetary orbits and transfer trajectories.
- **Phase D: Mission Operations (Stage 5 Simulate)**
  - Time-stepped telemetry simulation: battery DoD cycles, solar degradation, thermal equilibrium, propellant boiloff, and downlink buffers.
  - Realistic flight anomalies (solar storms, SEUs, reaction wheel friction, cryocooler leaks) with NASA SOP recommendations.
  - Mission Control Operations HUD with real-time MET clock, telemetry sparklines, chronological log, and CAPCOM Autopilot.
- **Phase E: Causal Debrief & Scoring (Stage 6)**
  - 100-point composite scorecard across Science, Cost, Schedule, Reliability, and Operations (S/A/B/C/D grade bands).
  - Attributed root-cause drivers ranking engineering decisions by point impact.
  - Counterfactual What-If simulation engine computing trade-off deltas.
  - Real-world NASA/ESA flight twin benchmarks (Landsat 9, TESS, SOHO, JWST, LRO, Chandrayaan-3, MAVEN).
  - Procedural embroidered SVG Mission Patch generator with vector download.
- **Phase F: Pilot Profile, History & Achievements**
  - Repository abstraction (`LocalRepository`) with last-write-wins timestamping and deterministic set union merging.
  - Pilot profile with procedural vector avatar, career stats, and XP progression curve (Cadet to Chief Engineer).
  - Filterable/sortable Mission History table with side-by-side comparison modal and JSON export/import.
  - 44 data-driven achievements with criteria DSL and synthesized Web Audio API fanfare chimes.
  - "Demo mode: unlock everything" toggle for evaluation and grading.
- **Phase G: Meridian Space Authority (MSA) Story Campaign**
  - Original 2041 narrative campaign following the loss of the Meridian-1 flagship.
  - Distinct procedural SVG cast: Director Imani Okafor, Chief Engineer Kenji Arai, Dr. Lucia Ferreira, and Treasury Liaison Arthur Hale.
  - Three live reputation tracks (Science Prestige, Public Trust, Treasury Solvency) shifting with player decisions.
  - 6 Chapters: Prologue, Act I (First Light, Cosmic Origins, The Quiet Sun), Act II (Eyes on Distant Suns, Lunar Pathfinder), and Stage 3 teaser for Chapter 6 Touchdown.
  - 8 title screen command modes: Campaign, Free Missions, Academy, Sandbox, Quick Start, Pilot Profile, Codex, Settings.

---

## Architecture Overview

```
src/
├── engine/             # Pure TypeScript astrodynamics & systems engineering
│   ├── constants.ts    # Astronomical & planetary constants (mu, R_E, J2, S0)
│   ├── units.ts        # Unit conversions and helpers
│   ├── orbit.ts        # Keplerian mechanics & numerical solver
│   ├── interplanetary.ts # Universal-variable Lambert solver & ephemeris
│   ├── ops/            # Mission operations simulation & flight events
│   ├── debrief.ts      # 100-point composite scorecard & What-If engine
│   ├── achievements/   # Deterministic criteria DSL evaluator
│   ├── profile/        # Rank curves & XP progression math
│   ├── autodesign.ts   # Rule-based auto-design constraint solver
│   ├── propulsion.ts   # Tsiolkovsky rocket equation & Delta-V budgets
│   ├── power.ts        # Solar array generation, loads, and battery DoD
│   ├── comms.ts        # Link budgets & daily data return fractions
│   ├── thermal-radiation.ts # Thermal sizing & multi-mechanism lifetime
│   ├── mass.ts         # Mass roll-up & AIAA mass growth allowances
│   ├── cost-schedule.ts# Parametric lifecycle cost & concurrent schedule
│   ├── science.ts      # Multiplicative science value & letter grading
│   ├── launch.ts       # Deterministic seeded launch simulation
│   ├── validate.ts     # 13 aerospace validation rules & automated fix patches
│   ├── evaluate.ts     # Pure <5ms evaluation pipeline
│   └── rng.ts          # Mulberry32 seedable PRNG
├── data/               # JSON catalogs & Zod schemas
│   ├── schemas.ts      # Zod validation schemas
│   ├── buses.json, components.json, instruments.json, launchers.json
│   ├── orbits.json, destinations.json, groundNetworks.json, scenarios.json
│   ├── events.json, exoplanets.json, space-weather.json, real-missions.json
│   ├── achievements.json, codex.json, glossary.json
│   ├── campaign/       # Narrative storyline, characters, and 6 chapter scripts
│   └── index.ts        # Catalog lookup loader
├── store/              # Zustand stores with persist & migrations
│   ├── mission.ts      # Mission design state & automated fix applicator
│   ├── ui.ts           # Active stage, tabs, mobile panes, toasts
│   ├── profile.ts      # Pilot rank, stats, achievements & audio chimes
│   ├── campaign.ts     # MSA faction reputations & chapter progression
│   └── settings.ts     # Graphics quality (LOW/HIGH), reduced motion, bloom
├── lib/
│   ├── repository/     # Unified profile & history persistence abstraction
│   ├── audio/          # Web Audio API synthesized fanfare & chime audio
│   └── storage.ts      # Safe local storage with in-memory fallback
├── components/
│   ├── ui/             # Mission control design system (Panel, Gauge, StatReadout, etc.)
│   ├── hud/            # TopBar, Live Resource Dashboard, Mission Advisor
│   ├── design/         # Stage 1-6 view components & CatalogPanel
│   ├── academy/        # Interactive Academy lessons & quiz widgets
│   ├── campaign/       # Classified dossier briefing & SVG character portraits
│   ├── profile/        # Pilot avatar generator, history table & compare modal
│   └── three/          # Spacecraft, Earth, OrbitView, Launch, SolarSystem, CanvasWrapper
├── app/
│   ├── page.tsx        # Command deck with 8 launch modes
│   ├── academy/        # Space Academy 6-lesson interactive training hub
│   ├── campaign/       # MSA Story Campaign command hub & act progression
│   ├── codex/          # Space Codex 92-article aerospace knowledgebase
│   ├── profile/        # Pilot dossier, trophy case, and flight history
│   ├── mission/new/    # Scenario campaign selection
│   ├── mission/[id]/   # Main Mission Workspace (Stages 1-6)
│   ├── learn/          # Orbital Lexicon & formulas
│   └── sandbox/        # Open unconstrained engineering studio
docs/
├── ENGINE.md           # Every equation, assumption, constant, and academic source
├── DATA.md             # Catalog schemas, flight analogues, and validation benchmarks
├── CAMPAIGN.md         # Campaign script format, authoring guide & reputation
└── AUDIT.md            # Forensic system audit, defects found, and hardening fixes
```

---

## Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm 9+ or pnpm 8+

### Installation & Local Development

```bash
# Clone repository
git clone https://github.com/jeevapriyan10/moonlander.git
cd moonlander

# Install pinned dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to launch the mission control center.

### Verification & Quality Gates

Run the automated verification suite:

```bash
# Run ESLint
npm run lint

# Run strict TypeScript check (strict: true, noUncheckedIndexedAccess: true)
npm run typecheck

# Run Vitest test suite (engine, data, catalog search, components)
npm run test

# Run Next.js production build
npm run build
```

---

## Deployment on Vercel

MoonLander is optimized for zero-configuration deployment on Vercel's free edge tier:
- **Zero Environment Variables:** Pure TypeScript evaluation and client-side persistence.
- **Zero Server Overhead:** All 3D assets and procedural textures are synthesized in-memory on the client.
- **Dynamic Imports:** All WebGL/Three.js canvases use `ssr: false` to ensure seamless Static Site Generation (SSG) compatibility.

Deploy with a single command:
```bash
npx vercel
```

---

## Design System & Accessibility

- **Keyboard Accessible:** Full keyboard navigation across tabs, modals, sliders, and stage rails.
- **High-Contrast Focus Rings:** Clearly visible `#FFB000` focus indicators on all interactive elements.
- **Color Independence:** Status badges combine color with distinct SVG icons (Lucide React) so that color is never the sole information carrier.
- **Prefers-Reduced-Motion:** Respects the user's OS accessibility motion settings by disabling camera lerping and continuous turntable rotations.
- **No Emojis:** Pure SVG vector iconography for an authentic NASA / ESA flight director experience.

---

## Academic References

1. Larson, W. J., & Wertz, J. R. (1999). *Space Mission Analysis and Design (SMAD)* (3rd ed.). Microcosm Press / Springer.
2. Vallado, D. A. (2013). *Fundamentals of Astrodynamics and Applications* (4th ed.). Microcosm Press.
3. NASA. (2016). *NASA Systems Engineering Handbook* (NASA/SP-2016-6105 Rev 2). National Aeronautics and Space Administration.
4. American Institute of Aeronautics and Astronautics. (2006). *AIAA S-120-2006: Mass Properties Control for Space Systems*. AIAA.

---

## License

MIT © 2026 MoonLander Contributors.
