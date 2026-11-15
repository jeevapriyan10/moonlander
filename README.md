# MOONLANDER // Deep Space Mission Simulator

[![CI](https://github.com/moonlander/moonlander/actions/workflows/ci.yml/badge.svg)](https://github.com/moonlander/moonlander/actions/workflows/ci.yml)
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

## Architecture Overview

```
src/
├── engine/             # Pure TypeScript astrodynamics & systems engineering
│   ├── constants.ts    # Astronomical & planetary constants (mu, R_E, J2, S0)
│   ├── units.ts        # Unit conversions and helpers
│   ├── orbit.ts        # Keplerian mechanics & numerical solver
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
│   ├── orbits.json, groundNetworks.json, scenarios.json, glossary.json
│   └── index.ts        # Catalog lookup loader
├── store/              # Zustand stores with persist & migrations
│   ├── mission.ts      # Mission design state & automated fix applicator
│   ├── ui.ts           # Active stage, tabs, mobile panes, toasts
│   └── settings.ts     # Graphics quality (LOW/HIGH), reduced motion, bloom
├── components/
│   ├── ui/             # Mission control design system (Panel, Gauge, StatReadout, etc.)
│   ├── hud/            # TopBar, Live Resource Dashboard, Mission Advisor
│   ├── design/         # Stage 1-6 view components & CatalogPanel
│   └── three/          # Spacecraft, Earth, OrbitView, Launch, CameraRig, CanvasWrapper
├── app/
│   ├── page.tsx        # Cinematic title screen
│   ├── mission/new/    # Scenario campaign selection
│   ├── mission/[id]/   # Main Mission Workspace
│   ├── learn/          # Orbital Lexicon & formulas
│   └── sandbox/        # Open unconstrained engineering studio
docs/
├── ENGINE.md           # Every equation, assumption, constant, and academic source
└── DATA.md             # Catalog schemas, flight analogues, and validation benchmarks
```

---

## Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm 9+ or pnpm 8+

### Installation & Local Development

```bash
# Clone repository
git clone https://github.com/moonlander/moonlander.git
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
