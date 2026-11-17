# MOONLANDER 

[![CI](https://github.com/jeevapriyan10/moonlander/actions/workflows/ci.yml/badge.svg)](https://github.com/jeevapriyan10/moonlander/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%20noUncheckedIndexedAccess-blue)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F%20%2B%20Drei-orange)](https://docs.pmnd.rs/react-three-fiber)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20%26%20Offline-success)](https://web.dev/progressive-web-apps/)

> **"Every mission begins with a decision."**  
> Where Kerbal Space Program's systems depth meets NASA flight-controller telemetry and lunar powered-descent gameplay.

**MoonLander** is an aerospace engineering simulation game where players architect, balance, launch, and operate real-world deep-space missions, culminating in high-stakes terminal lunar and Martian powered descent.

---

## 1. Complete Feature Set

### Stage 1: Core Aerospace Systems Engine
- **Pure Deterministic Physics (`src/engine/`):** Zero React/Three.js dependencies; Keplerian two-body propagation, Newton-Raphson Kepler solver ($< 10^{-12}$ tolerance), $J_2$ Sun-synchronous nodal precession, eclipse geometry, and RF link budgets.
- **Flight Data Catalogs (`src/data/`):** 5 satellite buses (12U CubeSat to Deep-Space Flagship), 24 subsystem components across 7 disciplines, 8 scientific payloads, 6 launch vehicles, and 9 orbital regimes with strict Zod validation.
- **Mission Control HUD:** 6-Stage mission workflow (Charter $\to$ Requirements $\to$ Design Studio $\to$ Launch $\to$ Simulation $\to$ Debrief) with live resource gauges and real-time validation diagnostics.

### Stage 2: Education, Interplanetary Physics & Narrative Campaign
- **Space Academy (`/academy`):** 6 interactive playable mini-lessons (Orbit Mechanics, Power Budgets, Propulsion, Thermal Equilibrium, Comms Links, and System Integration).
- **Space Codex (`/codex`):** 92 searchable aerospace engineering topics with mathematical formulas and NASA mission references.
- **Interplanetary Trajectories:** Universal-variable Lambert solver, Standish planetary ephemeris (1800–2050 AD), and interactive 3D Solar System view.
- **Meridian Space Authority Story Campaign (`/campaign`):** 10-chapter narrative campaign with procedural SVG character cast, reputation dynamics, and multiple endings.
- **Debrief & Causal Analysis:** 100-point composite scorecard (S/A/B/C/D), What-If trade-off simulation engine, and procedural embroidered SVG Mission Patch generator.

### Stage 3: Powered Descent, Multiplayer Crew, Social & Audio (Final)
- **Phase A: Lunar Powered Descent (`/mission/...` & `/replay`):**
  - 120 Hz fixed-timestep semi-implicit Euler physics engine: variable thrust throttleability (10–100%), RCS pitch torque limits, mass depletion ($\dot{m} = T / (I_{\text{sp}} g_0)$), landing leg span/stroke deflection, and hazard detection.
  - Procedural fractal terrain generation with crater stamps and boulder hazards modeled on real lunar sites (Apollo 11, Apollo 12, Apollo 15, Apollo 17, Chandrayaan-3, Chang'e 4, Artemis Shackleton).
  - Multi-input controls: Keyboard, Gamepad API, and Touch (throttle slider + attitude buttons) with 3 flight assist modes: **Autopilot**, **Assisted**, and **Manual**.
- **Phase B: Deep-Space Worlds & Campaign Finale:**
  - Act III Chapters 7 to 10 covering Jovian Ganymede, Saturn's Enceladus plumes, and Trappist-1 exoplanetary systems with verified catalog solvability.
- **Phase C: Cloud Sync & Pure Email Authentication (`/auth`):**
  - Supabase integration supporting passwordless magic link and pure email authentication (**zero third-party OAuth trackers**). Full offline-first fallback for guest players with zero configuration required.
- **Phase D: Crew Mode 4-Player Co-op (`/crew`):**
  - Multiplayer mission control room with 4 distinct roles: **Mission Director**, **Spacecraft Engineer**, **Flight Dynamics**, and **Comms & Finance**.
  - Negotiation council for resource requests, proposals, voting, and real-time host-authoritative op-log synchronization with a deterministic 15-point Team Coordination Score formula.
- **Phase E: Global Leaderboards, Social Sharing & Replays:**
  - Global, weekly, and daily leaderboards (`/leaderboard`) with server-verified score checks.
  - Tactical 1200x630px high-resolution PNG mission certificate export (`generateMissionCardBlob`) with one-click download and clipboard copy.
  - Spacecraft design blueprint import/export codes (`ML-V1-...`).
  - Interactive 2D powered-descent trajectory replay viewer (`/replay`) with 0.5x–4x playback scrubbing and telemetry instrumentation.
- **Phase F: Procedural Web Audio Engine:**
  - 100% real-time DSP synthesized audio in the browser via the native Web Audio API (zero external sample/audio file licensing liabilities).
  - Dynamic ambient score transitioning across flight phases (`calm`, `tense`, `descent`).
  - Tactile sound effects: clicks, caution alerts, throttle-driven continuous booster combustion rumble, contact thuds, and Apollo-style radio-squelch bursts.
  - Web Speech API TTS for CAPCOM callouts with live closed-captions radio banner.
- **Phase G: Product Polish, PWA & Multilingual Scaffold:**
  - Installable PWA with versioned service worker (`sw.js`) precaching Academy and offline missions with a safe update flow.
  - Typed i18n scaffolding supporting English (`en`), Spanish (`es`), French (`fr`), and Japanese (`ja`).
  - Dedicated transparency pages: `/privacy`, `/terms`, `/credits`, and `/ai-disclosure`.
  - Strict Content Security Policy (CSP) and hardening headers in `next.config.mjs`.
- **Phase H: Full Test Automation & Complete Docs Suite:**
  - Vitest test suite with 28 test files and 135 unit/property tests.
  - Playwright E2E suite covering smoke, campaign, descent, persistence, auth, and PWA.

---

## 2. Quickstart & Local Development

### Prerequisites
- Node.js 18.17+ or 20.x
- npm 9+

### Installation
```bash
# Clone the repository
git clone https://github.com/jeevapriyan10/moonlander.git
cd moonlander

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Verification & Quality Gates

MoonLander enforces strict quality gates across linting, type safety, deterministic simulation tests, and production builds:

```bash
# 1. Typecheck the entire project with strict checks
npm run typecheck

# 2. Run unit and property test suites (Vitest)
npm run test

# 3. Run ESLint code quality audit
npm run lint

# 4. Compile optimized production build
npm run build

# 5. Run Playwright end-to-end integration tests
npm run test:e2e
```

---

## 4. Environment Variables & Supabase Setup

MoonLander works **100% out of the box in guest mode with zero environment variables**.

To optionally enable cloud account synchronization and multiplayer crew persistence across devices, provide your Supabase credentials:

Create `.env.local`:
```env
# Supabase Configuration (Optional for cloud sync)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... # (Optional: for server-side verification)
```

### Supabase Table Schema
Execute the following DDL in your Supabase SQL editor:
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  callsign text not null,
  avatar_seed text not null,
  current_rank text not null default 'Cadet',
  xp integer not null default 0,
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table mission_saves (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  scenario_id text not null,
  difficulty text not null,
  is_sandbox boolean not null default false,
  config jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table leaderboard_entries (
  id text primary key,
  user_id uuid references auth.users on delete set null,
  callsign text not null,
  score integer not null,
  scenario_id text not null,
  difficulty text not null,
  metrics jsonb not null,
  verified boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table mission_saves enable row level security;
alter table leaderboard_entries enable row level security;

-- Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can read own missions" on mission_saves for select using (auth.uid() = user_id);
create policy "Users can upsert own missions" on mission_saves for all using (auth.uid() = user_id);
create policy "Anyone can read leaderboard" on leaderboard_entries for select using (true);
```

---

## 5. Deployment on Vercel

MoonLander is designed for seamless, one-click deployment on Vercel:

1. Push your repository to GitHub / GitLab.
2. Import the repository into the **Vercel Dashboard**.
3. (Optional) Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Project Settings $\to$ Environment Variables.
4. Click **Deploy**.

Vercel automatically detects Next.js 14 App Router and optimizes static and dynamic edge routes.

---

## 6. Synthetic Intelligence (SI) Assistance Disclosure

In accordance with open-source engineering transparency and NASA Space Apps Challenge regulations:
- **MoonLander was engineered with Synthetic Intelligence (SI) assistance** (LLM code generation, astrodynamic calculation verification, procedural DSP audio algorithms, and documentation authorship).
- **All core physics logic, state machines, and mathematical equations are verified by automated test suites.**
- **Source and data files carry the `@aiAssisted true` annotation.**
- **No restricted NASA/ESA logos, insignias, or mission patches are used; all mission patches and vector insignia are 100% original and procedurally generated.**

---

## 7. Scientific Citations & References

1. Larson, W. J., & Wertz, J. R. (1999). *Space Mission Analysis and Design (SMAD)* (3rd ed.). Microcosm Press / Springer.
2. Vallado, D. A. (2013). *Fundamentals of Astrodynamics and Applications* (4th ed.). Microcosm Press.
3. NASA. (2016). *NASA Systems Engineering Handbook* (NASA/SP-2016-6105 Rev 2). National Aeronautics and Space Administration.
4. American Institute of Aeronautics and Astronautics. (2006). *AIAA S-120-2006: Mass Properties Control for Space Systems*. AIAA.
5. Standish, E. M. (1992). *Keplerian Elements for Approximate Positions of the Major Planets*. Jet Propulsion Laboratory.

---

## 8. License

Released under the open [MIT License](LICENSE). Third-party planetary maps courtesy of Solar System Scope (CC BY 4.0) and NASA Visible Earth (Public Domain).
