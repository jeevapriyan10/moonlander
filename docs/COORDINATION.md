# MoonLander Crew Mode & Team Coordination Score (15 Points)

**Specification Version:** 1.0.0  
**Domain:** Multiplayer Systems Engineering & Consensus Protocol  
**Authoritative Engine:** `src/engine/crew/coordination.ts`  

---

## 1. Overview

In MoonLander **Crew Mode**, up to 4 players collaborate on a shared bridge to design, simulate, and fly deep-space missions. Rather than permitting unilateral dominance by a single player, MoonLander partitions ownership across 4 operational roles:

| Role | Badge | Color | Authoritative Subsystem Ownership |
| :--- | :--- | :--- | :--- |
| **Mission Director / PI** | `DIR` | Amber | Mission Title, Scenario, Difficulty, Scientific Payloads/Instruments, Tie-Breaker Vote. |
| **Chief Spacecraft Engineer** | `ENG` | Cyan | Bus Class, Solar Arrays, Batteries, Attitude Control (ADCS), Flight Computer, Thermal Systems. |
| **Flight Dynamics & Launch (FDO)** | `FDO` | Emerald | Target Orbit Regime, Launch Vehicle, Propulsion System, Propellant Mass. |
| **Communications & Comptroller** | `COM` | Purple | High/Medium Gain Antennas, Ground Station Network, Data Storage, Budget Compliance. |

---

## 2. Team Coordination Score Formula (Max 15 Points)

At the conclusion of a mission debrief, a dedicated **15-point Team Coordination Score** is deterministically computed across 4 dimensions:

$$\text{Score}_{\text{coord}} = S_{\text{balance}} + S_{\text{speed}} + S_{\text{veto}} + S_{\text{margins}} \le 15$$

### Dimension 1: Balanced Contribution ($S_{\text{balance}} \in [0, 5]$)
Measures multidisciplinary engagement across all four seats:
- **5 points**: All 4 roles contributed changes, and standard deviation of operation count $\le 0.75 \times \text{mean}$.
- **4 points**: All 4 roles contributed with moderate variance.
- **3 points**: Exactly 3 roles contributed actively.
- **2 points**: Exactly 2 roles contributed actively.
- **1 point**: Solo domination (single role executed $>90\%$ of patches).

### Dimension 2: Dispute Resolution Speed ($S_{\text{speed}} \in [0, 4]$)
Evaluates how swiftly the crew evaluated inter-role proposals:
- **4 points**: Mean resolution time $\le 30$ seconds (or zero disputes filed due to clean consensus).
- **3 points**: Mean resolution time $\le 60$ seconds.
- **2 points**: Mean resolution time $\le 120$ seconds.
- **1 point**: Mean resolution time $> 120$ seconds.

### Dimension 3: Veto & Conflict Penalty ($S_{\text{veto}} \in [0, 3]$)
Measures harmony and friction during subsystem trades:
$$S_{\text{veto}} = \max(0, 3 - N_{\text{rejected\_proposals}})$$
- Every formal proposal rejected or vetoed subtracts 1 point (down to a minimum of 0).

### Dimension 4: Final Margin Agreement ($S_{\text{margins}} \in [0, 3]$)
Evaluates whether inter-subsystem negotiations produced healthy engineering margins:
- **+1 point**: Electrical power margin $> 0\text{ W}$ across daylight and eclipse.
- **+1 point**: Structural mass growth margin $> 0\text{ kg}$.
- **+1 point**: Launch vehicle lift capability and budget cap verified nominal.

---

## 3. Host-Authoritative Operational Log & Convergence

1. **State Ownership**: The room host maintains authoritative state version $V_H$.
2. **Operations**: Clients emit `{ opId, role, patch, baseVersion, timestamp }`.
3. **Rebasing**: If a client submits an op with $V_{\text{base}} < V_H$:
   - If no intermediate operation modified the same fields, the host applies the patch cleanly (rebase).
   - If a concurrent conflict is detected on the same field, the operation is rejected with an explanatory reason and the client pulls the latest state.
4. **Convergence Guarantee**: Replaying the canonical log from base seed produces identical binary spacecraft state across all connected clients.
