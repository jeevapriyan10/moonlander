# MoonLander System Architecture

MoonLander is engineered as a zero-compromise, browser-native aerospace mission design and powered-descent simulation platform.

```
+-----------------------------------------------------------------------------------+
|                                 USER INTERFACE                                    |
|   Next.js 14 App Router  *  Tailwind CSS  *  Lucide Icons  *  Barlow / JetBrains  |
|   +-----------------------+ +--------------------+ +---------------------------+  |
|   | Flight Deck / HUD     | | Space Academy      | | Crew Negotiation Council  |  |
|   | 6-Stage Design Studio | | Campaign Narrative | | Replay Telemetry Vault    |  |
|   +-----------------------+ +--------------------+ +---------------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         CLIENT STATE & PERSISTENCE LAYER                          |
|   Zustand Stores (Mission, UI, Profile, Settings, Crew, Auth)                     |
|   * LocalStorage & IndexedDB with safe hydration & LWW reconciliation             |
|   * Supabase Cloud Sync (PostgreSQL RLS + Realtime Op-Log Interleaving)           |
+-----------------------------------------------------------------------------------+
                                         |
                  +----------------------+----------------------+
                  |                                             |
                  v                                             v
+------------------------------------+        +-------------------------------------+
|      DETERMINISTIC PHYSICS         |        |         3D GRAPHICS & AUDIO         |
|         `src/engine/`              |        |   `src/components/three/` & `audio` |
|  * Strict Pure TypeScript          |        |  * React Three Fiber (Three.js)     |
|  * 0 React / 3D Imports            |        |  * Multi-Tier Texture LOD Streaming |
|  * < 5ms Analytical Evaluation     |        |  * Procedural Celestial Shaders     |
|  * 120 Hz Semi-Implicit Euler      |        |  * 100% Procedural DSP Web Audio    |
|  * Standish J2000 Ephemerides      |        |  * Web Speech CAPCOM Voice Engine   |
|  * Universal-Variable Lambert      |        +-------------------------------------+
+------------------------------------+
```

---

## 1. Core Principles

1. **Deterministic & Isolated Engine (`src/engine/`)**:
   - The engine is 100% pure TypeScript. It has strictly **zero imports** from `react`, `react-dom`, `@react-three/fiber`, or `three`.
   - Physics simulations can run headlessly in Node.js, Web Workers, or CI property fuzzing tests.
   - Evaluation pipeline execution time is $< 5\text{ ms}$, ensuring responsive 60 FPS slider interactions in the UI.

2. **120 Hz Fixed-Timestep Powered Descent (`src/engine/lander.ts`)**:
   - Uses a **Semi-Implicit (Symplectic) Euler** integrator:
     $$\mathbf{v}_{n+1} = \mathbf{v}_n + \mathbf{a}_n \cdot \Delta t$$
     $$\mathbf{x}_{n+1} = \mathbf{x}_n + \mathbf{v}_{n+1} \cdot \Delta t$$
   - Preserves phase space volume and avoids artificial orbital energy drift over thousands of simulation steps.
   - Eliminates sub-step float rounding divergence present in multi-stage Runge-Kutta (RK4) integrators when discrete player inputs (throttle nudges, RCS pulses) occur mid-step. Replays are 100% bitwise reproducible.

3. **Multiplayer Op-Log Convergence (`src/engine/crew/`)**:
   - Shared mission state in Crew Mode uses host-authoritative patch logs `{ opId, role, patch, baseVersion }`.
   - Out-of-order patches trigger automatic client rebasing.
   - Role boundaries are enforced at the type level: a Flight Dynamics role cannot mutate Spacecraft Bus hardware, and Spacecraft Engineers cannot override launch vehicle selections.

4. **Zero External Audio Licensing Liability (`src/lib/audio/`)**:
   - All sounds (ambient chords, engine rumble, caution tones, contact impact thuds, and radio-frequency squelch bursts) are generated via Web Audio API oscillators, noise generators, and biquad filters.

---

## 2. Directory Map

| Path | Purpose |
| :--- | :--- |
| `src/engine/` | Pure deterministic aerospace physics, orbital mechanics, powered descent, debrief, and scoring |
| `src/data/` | Strongly-typed Zod schemas and catalogs (buses, launchers, payloads, orbits, campaign) |
| `src/store/` | Zustand state machines (mission design, UI stages, pilot profile, crew room, settings, auth) |
| `src/components/three/` | 3D visualizers (spacecraft bus, trajectory orbits, planetary bodies, powered descent scene) |
| `src/components/hud/` | Flight deck HUD, TopBar, Coach guidance, Dashboard gauges, and Mission Systems Advisor |
| `src/lib/audio/` | Real-time procedural DSP synthesizers and generative ambient score engine |
| `src/lib/i18n/` | Multilingual scaffolding and translation dictionaries (`en`, `es`, `fr`, `ja`) |
| `src/lib/pwa/` | Progressive Web App registration, offline detection, and safe service worker updates |
| `tests/` | Unit, property, and Playwright end-to-end integration test suites |
