# MoonLander Campaign Engine & Authoring Guide

This document describes the narrative architecture, dialogue script format, reputation mechanics, and step-by-step authoring workflow for the **Meridian Space Authority (MSA) 2041** story campaign in MoonLander.

---

## 1. Narrative Architecture Overview

The story campaign is structured into **Acts** and **Chapters**, set in the near-future year 2041 following the catastrophic communication loss of the flagship *Meridian-1* probe at Jupiter's orbit.

The player steps into the role of newly appointed **Flight Director** at the Meridian Space Authority (MSA), balancing three competing institutional factions across six mission directives:

1. **Science Prestige:** Championed by **Dr. Lucia Ferreira** (Lead Planetary Scientist). Prioritizes raw discovery, multi-spectral instrument suites, and deep-space observation over cost or comfort.
2. **Public Trust:** Championed by **Director Imani Okafor** (MSA Director). Prioritizes mission reliability, safety margins, planetary stewardship, and civilian public support.
3. **Treasury Solvency:** Championed by **Arthur Hale** (Parliamentary Treasury Liaison). Prioritizes budget discipline, commercial off-the-shelf hardware, and lean schedules.

Technical ground truth is provided by **Chief Engineer Kenji Arai**, who evaluates physical feasibility and cautions against unrealistic compromises.

---

## 2. Campaign Script Schema (`src/data/campaign/types.ts`)

Campaign chapters are defined as pure, deterministic TypeScript data structures in `src/data/campaign/chapters.ts`.

### 2.1 Character Definition
```typescript
export interface CampaignCharacter {
  id: string;              // Unique identifier (e.g., "okafor", "arai")
  name: string;            // Full display name
  role: string;            // Title (e.g., "MSA Director")
  callsign: string;        // Short HUD callsign
  avatarSeed: string;      // Seed for procedural vector portrait
  accentColor: string;     // Hex color code for badges and borders
}
```

### 2.2 Script Node Types
Each chapter's script is a directed graph of nodes:
- **`say` node**: A character delivers narrative dialogue.
- **`choice` node**: Presents 2–3 branching tactical options with live reputation consequences.
- **`grant` node**: Silently awards XP or adjusts reputation before proceeding.

```typescript
export interface ChoiceOption {
  text: string;                             // Display text for the button
  next: string;                             // Target node ID to navigate to
  effects?: {
    rep?: Partial<Record<FactionId, number>>; // e.g. { science: +10, treasury: -15 }
    xp?: number;
  };
}

export interface ScriptNode {
  id: string;                               // Node identifier (e.g., "node_01")
  speakerId: string;                        // ID of character speaking
  text: string;                             // Dialogue paragraph (supports typewriter effect)
  next?: string;                            // Next node ID for linear progression
  choices?: ChoiceOption[];                 // Array of choices for branching nodes
}
```

### 2.3 Chapter Structure
```typescript
export interface CampaignChapter {
  id: string;                     // e.g. "chapter-1-first-light"
  number: number;                 // Chapter index
  act: number;                    // Act number (1 = Genesis, 2 = Expansion, 3 = Odyssey)
  title: string;                  // Chapter display title
  subtitle: string;               // Tactical subtitle
  dossierSummary: string;         // Confidential dossier debriefing text
  scenarioId: string;             // Linked playable scenario (from scenarios.json)
  requiredLevel: string;          // Minimum difficulty
  reputationModifier: Record<FactionId, number>; // Baseline faction bias
  dialogueGraph: Record<string, ScriptNode>;     // Complete dialogue tree
  entryNodeId: string;            // Root node ID
  victoryNodeId: string;          // Post-mission debrief root node ID
  xpReward: number;               // Completion XP
}
```

---

## 3. How to Author a New Chapter

Follow this step-by-step checklist to add a new chapter to the campaign:

### Step 1: Define Chapter Metadata
In `src/data/campaign/chapters.ts`, create a new chapter definition:
```typescript
export const chapterCustom: CampaignChapter = {
  id: "chapter-custom",
  number: 7,
  act: 3,
  title: "PROJECT PROMETHEUS",
  subtitle: "Nuclear Thermal Propulsion In-Flight Test",
  dossierSummary: "Parliament has authorized testing of next-generation high-Isp bimodal thermal engines in high orbit.",
  scenarioId: "lunar-south-pole",
  requiredLevel: "ADVANCED",
  reputationModifier: { science: 10, public: -5, treasury: -10 },
  entryNodeId: "start",
  victoryNodeId: "debrief",
  xpReward: 3500,
  dialogueGraph: { ... }
};
```

### Step 2: Build the Dialogue Graph
Construct the linear or branching conversation ensuring:
1. Every node points to an existing `next` node ID or specifies `choices` with valid `next` pointers.
2. The graph contains a terminal choice or node that launches the mission (triggering `onLaunchMission`).
3. Faction reputation impacts are balanced: gaining science prestige often costs treasury solvency.

```typescript
dialogueGraph: {
  start: {
    id: "start",
    speakerId: "okafor",
    text: "Flight Director, the Board is divided on the proposed burn profile.",
    choices: [
      {
        text: "Prioritize maximum payload instruments (High Science)",
        next: "path_science",
        effects: { rep: { science: 15, treasury: -10 } },
      },
      {
        text: "Prioritize redundant avionics and safety margins (High Public Trust)",
        next: "path_public",
        effects: { rep: { public: 15, treasury: -5 } },
      },
      {
        text: "Streamline off-the-shelf bus to preserve budget (High Treasury)",
        next: "path_treasury",
        effects: { rep: { treasury: 20, science: -10 } },
      },
    ],
  },
  // Define continuation nodes...
}
```

### Step 3: Run Graph Validation Tests
Run the automated campaign test suite:
```bash
npx vitest run src/data/campaign/campaign.test.ts
```
The test verifies:
- All chapter IDs are unique.
- All referenced speakers exist in `characters.ts`.
- Every `next` target node exists (no broken links).
- Every linked `scenarioId` exists in `src/data/scenarios.json`.
- There are no cycles that prevent reaching the mission launch trigger.

---

## 4. Reputation Mechanics

Reputation tracks are stored in `src/store/campaign.ts` and persist across sessions:

| Faction | Neutral | Minimum | Maximum | In-Game Effect |
| :--- | :--- | :--- | :--- | :--- |
| **Science Prestige** | 50 | 0 | 100 | Higher scores unlock advanced sensor payloads in the catalog. |
| **Public Trust** | 50 | 0 | 100 | Higher trust reduces mission risk perception and increases CAPCOM tolerance for anomalies. |
| **Treasury Solvency** | 50 | 0 | 100 | Directly grants bonus budget percentage ($\pm 15\%$) to future chapter missions. |

When completing a mission with high debrief scores ($S$ or $A$), the campaign awards bonus reputation across all factions based on the mission's science return and budget surplus.
