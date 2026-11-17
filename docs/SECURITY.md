# MoonLander Security Architecture & Threat Model

**Document Version:** 1.0.0  
**Classification:** Public Engineering Specification  
**Status:** Active  

---

## 1. Executive Summary

MoonLander operates on a **zero-trust, privacy-first aerospace simulation architecture**. The game supports two primary operation modes:
1. **Air-Gapped Guest Mode (Default):** Functions with zero network connections, persisting state exclusively in browser-local storage (`localStorage` / IndexedDB). Requires zero environment variables.
2. **Cloud-Synchronized Mode (Supabase):** Provides cross-device profile progression, telemetry history, flight replays, and public verified leaderboards using **strictly pure email authentication** (Magic Link or Email + Password).

MoonLander **strictly prohibits third-party OAuth providers** (e.g., Google, GitHub, Facebook) to eliminate external telemetry trackers, third-party token leakage, and authentication fingerprinting.

---

## 2. Threat Model & Boundaries

| Threat Actor | Vector | Mitigation |
| :--- | :--- | :--- |
| **Malicious Client** | Tampered mission telemetry submitted to leaderboard (e.g. infinite delta-v, zero cost). | **Server-Side Deterministic Re-Simulation**: Submissions are evaluated via `src/app/api/verify-mission/route.ts` running the pure deterministic physics engine (`evaluateMission`). Unverifiable runs are flagged `verified: false` and denied leaderboard entry. |
| **Unauthorized User** | Direct database reads/writes attempting to hijack other players' missions or history. | **Postgres Row Level Security (RLS)**: Enforced at the database level on all tables (`profiles`, `missions`, `history`, `replays`). Users can only mutate records where `auth.uid() = user_id`. |
| **Offensive Actor** | Profane, hateful, or spoofed callsigns in multiplayer lobbies and leaderboards. | **Pre-Flight Callsign Gate (`src/lib/auth/callsign.ts`)**: Strict alphanumeric regex `^[a-zA-Z0-9_-]+$`, 3–20 character limits, and profanity blocklist filtering before database write. |
| **Man-in-the-Middle** | Interception of authentication tokens. | All communication over TLS 1.3. Sessions stored via HttpOnly-compatible secure token storage. Supabase JWTs with short-lived access tokens and automated rotation. |
| **Data Scraping** | Bulk scraping of user profile data. | Profile data exposes only public callsign, current rank, and aggregate XP. PII (email address) is isolated in Postgres `auth.users` with zero public read permissions. |

---

## 3. Pure Email Authentication Architecture

### 3.1 Authentication Methods Supported
1. **Passwordless Magic Link (`signInWithOtp`)**:
   - Secure one-time login links delivered to the user's email.
   - Eliminates credential reuse attacks and password hashing vulnerabilities.
2. **Email & Password (`signUp`, `signInWithPassword`)**:
   - Standard email + password sign up and sign in.
   - Enforces minimum 8-character length.

### 3.2 Omission of OAuth Providers
- Third-party social logins (Google, GitHub, Apple) are **explicitly excluded** from the codebase.
- No third-party tracking scripts, OAuth SDKs, or external identity redirects are loaded into the browser runtime.

---

## 4. Row Level Security (RLS) Policy Specifications

### `public.profiles`
- `SELECT`: Public (`true`) — required for leaderboard and multiplayer callsign resolution.
- `INSERT`: Restricted to `auth.uid() = id`.
- `UPDATE`: Restricted to `auth.uid() = id`.
- `DELETE`: Restricted to `auth.uid() = id`.

### `public.missions`
- `SELECT`: Restricted to `auth.uid() = user_id`.
- `INSERT`: Restricted to `auth.uid() = user_id`.
- `UPDATE`: Restricted to `auth.uid() = user_id`.
- `DELETE`: Restricted to `auth.uid() = user_id`.

### `public.history`
- `SELECT`: Restricted to `auth.uid() = user_id`.
- `INSERT`: Restricted to `auth.uid() = user_id`.
- `UPDATE`: Restricted to `auth.uid() = user_id`.
- `DELETE`: Restricted to `auth.uid() = user_id`.

### `public.leaderboard_entries`
- `SELECT`: Public (`true`).
- `INSERT`: Restricted to `auth.uid() = user_id` OR authenticated Server Route via Service Role key.

---

## 5. Offline Queue & Guest Data Import

1. **Offline Write Queue**:
   - If network connectivity is interrupted (`navigator.onLine === false`) or API calls fail with network timeouts, writes are queued in `moonlander:offline_queue`.
   - The queue is drained sequentially with exponential backoff upon network restoration (`window.addEventListener("online")`).
2. **First-Time Guest Import**:
   - When a guest user logs in for the first time, MoonLander prompts the user to import their local guest flight records and achievements.
   - Merge rules are non-destructive:
     - XP: Highest between local and remote.
     - Achievements: Set union of local and cloud unlocked achievement IDs.
     - Flight Records: Appended by unique flight ID.
     - Personal Bests: Highest score per scenario preserved.

---

## 6. Server-Side Verification Pipeline (`/api/verify-mission`)

To preserve the integrity of global speedruns and landing leaderboards:
1. The client submits the complete `MissionDesignConfig` and final flight outcome metrics.
2. The Next.js Route Handler retrieves the scenario specification from `src/data/scenarios.json`.
3. The server runs `evaluateMission(config, catalog)`:
   - Validates total mass, center of mass, delta-v delivery, power balance, thermal dissipation, and structural limits.
   - Verifies that calculated success probability and mission constraints align with submitted scores.
4. If valid, the submission is signed as `verified: true` and written to `public.leaderboard_entries`.
