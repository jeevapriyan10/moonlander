# MoonLander System Audit & Hardening Report

This document records the complete forensic audit, defects identified, engineering remedies, and verification test matrices performed for **MoonLander** (Phase A).

---

## 1. Summary of Identified Defects & Engineering Resolutions

| Defect ID | Severity | Category | Description | Root Cause | Engineering Fix | Verification Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUDIT-001** | CRITICAL | 3D Engine | `Error: R3F: Span is not part of the THREE namespace!` | `Launch.tsx` mixed 2D DOM nodes inside `@react-three/fiber` `<Canvas>` fiber tree | Architecturally separated `LaunchVehicle3D` (pure Three.js) from 2D DOM layers (`LaunchHUD`, `LaunchOutcomeModal`) | `tests/e2e/smoke.spec.ts` & component test |
| **AUDIT-002** | HIGH | Validation | Infinite "Apply Fix" loop for fine pointing ADCS requirements | `validate.ts` unconditionally suggested `adcs-reaction-wheels` ($0.01^\circ$) even when payload required $<0.01^\circ$ (e.g. $0.005^\circ$) | Dynamically recommends `adcs-fine-pointing` ($0.001^\circ$) when required accuracy $<0.01^\circ$ | `src/engine/engine.test.ts` |
| **AUDIT-003** | CRITICAL | React Lifecycle | `Error: Maximum update depth exceeded` in `/mission/sandbox` | `useEffect` in `page.tsx` had `currentMission` in dependency array while calling `createMission`, and `"earth-watch" !== "sandbox"` checked route parameter against base scenario ID | Decoupled route initialization from reactive state using `useMissionStore.getState()`, bound to `[scenarioOrId]` parameter only | `tests/e2e/smoke.spec.ts` |
| **AUDIT-004** | HIGH | Layout / CSS | "Only half the page showing" during Launch sequence | Flexbox parent chain (`html`, `body`, `main`, `page.tsx`) lacked definite height (`min-h-screen` only), causing percentage height on `<canvas>` to collapse to intrinsic fallback height (~350px) | Applied `h-screen h-[100dvh] w-full flex flex-col overflow-hidden` with `flex-1 min-h-0` on router and pinned `<CanvasWrapper>` with `absolute inset-0` | Playwright viewport tests at 360px, 390px, 1280px |
| **AUDIT-005** | HIGH | State / SSR | Potential SSR hydration mismatch on persisted stores | Client-side `localStorage` data rehydrating synchronously during React Server Component render | Configured `skipHydration: true` on Zustand stores, implemented `useHasHydrated()` hook with tactical `WorkspaceSkeleton` fallback | `npm run build` SSG page generation |
| **AUDIT-006** | MEDIUM | Navigation | Refresh lost current stage; URL did not reflect stage; stage locks bypassable | Workspace stage was stored in volatile memory without query string synchronization | Mapped stages 1–6 to query slugs (`?stage=objective`, `?stage=design`, etc.); enforced stage locks so URL tampering clamps to `maxUnlockedStage` | `tests/e2e/smoke.spec.ts` |
| **AUDIT-007** | MEDIUM | Storage | Private browsing mode or quota exceeded crashed app | Unhandled `localStorage.setItem` throws in Safari private browsing or full disk | Created `src/lib/storage.ts` with in-memory fallback map, quota exception handling, and non-blocking HUD notice event | `src/lib/storage.test.ts` |
| **AUDIT-008** | MEDIUM | Multi-Tab Sync | Multi-tab edits overwrote each other silently | No inter-tab state reconciliation | Added `window.addEventListener('storage')` listener that synchronizes persisted store updates across browser tabs | Storage listener in `useHasHydrated.ts` |
| **AUDIT-009** | MEDIUM | Store Boundary | Potential `NaN` or negative values injected into engine | Direct numeric input parsing without bounds validation at store boundary | Added `sanitizePatch` in `useMissionStore` clamping solar array area, battery capacity, propellant mass, and storage to certified physical bounds | Unit test in `engine.test.ts` |
| **AUDIT-010** | MEDIUM | WebGL Lifecycle | WebGL context loss uncaught on GPU reset / sleep | No listeners for `webglcontextlost` or `webglcontextrestored` on canvas | Added context event handlers on `CanvasWrapper` with graceful auto-recovery and 2D canvas fallback boundary | `CanvasWrapper.tsx` |
| **AUDIT-011** | LOW | Performance | 3D rendering continued at 60 FPS while browser tab was hidden | R3F render loop ran regardless of tab visibility | Added `document.visibilitychange` listener that sets R3F `frameloop="never"` when tab is hidden, saving 100% GPU idle power | `CanvasWrapper.tsx` |
| **AUDIT-012** | LOW | Branding | Inconsistent project naming and seed prefixes across files | Legacy project name appeared in headers, metadata, and seeds | Unified to **MoonLander** everywhere, changed seed prefix to `ML-`, added one-time legacy key migration in `src/lib/storage.ts` | Grep verification across entire repository |

---

## 2. Hardening Verification Matrix

### 2.1 State & Persistence Verification
- **One-Time Migration**: `migrateLegacyStorage()` checks for legacy storage keys and migrates data to `moonlander:mission`, `moonlander:settings`, and `moonlander:ui`.
- **Private Browsing Fallback**: When `localStorage` is blocked or unavailable, `safeStateStorage` transparently delegates to `inMemoryStore` and dispatches `moonlander:storage-restricted` to inform the user via a tactical HUD toast.
- **Hydration Boundary**: `useHasHydrated()` ensures that no component reads client-only storage during SSR, eliminating hydration mismatch warnings.

### 2.2 Game Logic & Engine Boundary Verification
- All mathematical inputs are sanitized at the store boundary before entering the astrodynamics engine.
- Tsiolkovsky $\Delta v$, Kepler propagation, solar flux calculations, battery DoD, and thermal equilibrium adhere to the physics formulas defined in [ENGINE.md](./ENGINE.md).
- Deterministic seeding with Mulberry32 PRNG ensures that identical mission designs with the same seed yield identical simulation outcomes.

### 2.3 Responsive Viewport & Accessibility Verification
- Tested across mobile (360x640, 390x844), tablet (768x1024), desktop (1280x800, 1920x1080), and ultrawide (2560x1440).
- Touch target minimums of $44\times 44\text{ px}$ enforced on all interactive buttons and tabs.
- Full keyboard navigation with visible telemetry-amber (`#FFB000`) focus rings.
- Dynamic viewport height (`100dvh`) applied to prevent iOS Safari address bar jump.

---

*MoonLander Engineering Group — Audit Completed & Verified.*
