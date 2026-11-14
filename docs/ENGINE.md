# MissionForge Engine Architecture & Astrodynamics Specification

This document provides a comprehensive, rigorous reference for every physical equation, engineering model, astrodynamic constant, unit convention, and source citation implemented in the pure TypeScript simulation kernel (`src/engine/`).

The engine contains zero React, Three.js, or DOM dependencies. All functions are pure, deterministic, and return serializable objects.

---

## 1. Fundamental Constants and Unit Conventions

All constants adhere to IAU/COSPAR standards and the NASA Goddard Flight Dynamics Facility reference models.

| Symbol | Parameter | Value | Standard Units | Source / Reference |
| :--- | :--- | :--- | :--- | :--- |
| $\mu_{\text{Earth}}$ | Earth Gravitational Parameter | $398600.4418$ | $\text{km}^3 / \text{s}^2$ | WGS-84 / EGM96 |
| $R_E$ | Earth Mean Equatorial Radius | $6378.137$ | $\text{km}$ | WGS-84 |
| $J_2$ | Second Zonal Harmonic (Oblateness) | $1.08263 \times 10^{-3}$ | Dimensionless | EGM96 |
| $g_0$ | Standard Surface Gravity | $9.80665$ | $\text{m} / \text{s}^2$ | CODATA standard |
| $S_0$ | Solar Flux at 1 AU (Solar Constant) | $1361.0$ | $\text{W} / \text{m}^2$ | SORCE / TSIS-1 |
| $S_{\text{Mars}}$| Solar Flux at Mars (1.524 AU) | $586.0$ | $\text{W} / \text{m}^2$ | Inverse-square law |
| $c$ | Speed of Light in Vacuum | $299792458$ | $\text{m} / \text{s}$ | SI standard |

### Identifier Unit Conventions
Every variable and identifier across the engine and data catalogs explicitly specifies its physical units in its name:
- Altitudes and Distances: `altKm`, `semiMajorAxisKm`, `radiusKm`
- Velocities and Velocity Increments: `velocityKmS`, `dvMs`
- Masses: `massKg`, `dryMassKg`, `wetMassKg`, `propellantMassKg`
- Power and Energy: `powerW`, `loadW`, `energyWh`, `capacityWh`
- Angles: `angleDeg`, `inclinationDeg`, `rad`
- Rates and Data: `rateMbps`, `dataGbPerDay`, `storageGb`
- Durations: `seconds`, `months`, `years`

---

## 2. Orbital Mechanics & Keplerian Dynamics (`src/engine/orbit.ts`)

### 2.1 Two-Body Orbit Properties
For a spacecraft in orbit about Earth with perigee altitude $h_p$ and apogee altitude $h_a$:
$$\text{Perigee Radius: } r_p = R_E + h_p$$
$$\text{Apogee Radius: } r_a = R_E + h_a$$
$$\text{Semi-Major Axis: } a = \frac{r_p + r_a}{2}$$
$$\text{Eccentricity: } e = \frac{r_a - r_p}{r_a + r_p}$$

Orbital Period via Kepler's Third Law:
$$T = 2\pi \sqrt{\frac{a^3}{\mu_{\text{Earth}}}} \quad [\text{seconds}]$$
$$\text{Orbits per Day: } N_{\text{day}} = \frac{86400}{T}$$

Circular Orbital Velocity at altitude $h$:
$$v_{\text{circ}} = \sqrt{\frac{\mu_{\text{Earth}}}{R_E + h}} \quad [\text{km/s}]$$

### 2.2 Kepler's Equation & Numerical Solver
Orbital propagation requires inverting Kepler's equation relating Mean Anomaly $M$ to Eccentric Anomaly $E$:
$$M = E - e \sin E$$

We solve for $E$ given $M$ and $e$ using a guarded Newton-Raphson iteration:
$$E_{n+1} = E_n - \frac{E_n - e \sin E_n - M}{1 - e \cos E_n}$$
- Initial guess: $E_0 = M + e \sin M + \frac{e^2}{2} \sin(2M)$
- Convergence tolerance: $|E_{n+1} - E_n| < 10^{-12}$
- Maximum iterations: 50 (guarded against numerical stall)

True Anomaly $\nu$ is subsequently derived via:
$$\nu = 2 \arctan2\left(\sqrt{1+e}\sin\frac{E}{2}, \sqrt{1-e}\cos\frac{E}{2}\right)$$

Orbital radius as a function of true anomaly:
$$r(\nu) = \frac{a(1 - e^2)}{1 + e \cos \nu}$$

### 2.3 Sun-Synchronous Orbit (SSO) Inclination
The nodal precession rate $\dot{\Omega}$ driven by Earth's $J_2$ equatorial bulge must match Earth's mean orbital motion around the Sun ($360^\circ / 365.2422 \approx 0.9856^\circ/\text{day} = 1.99106 \times 10^{-7}\text{ rad/s}$):
$$\dot{\Omega} = -\frac{3}{2} J_2 \left(\frac{R_E}{a(1-e^2)}\right)^2 \sqrt{\frac{\mu_{\text{Earth}}}{a^3}} \cos(i)$$
Solving for inclination $i_{\text{sso}}$:
$$\cos(i_{\text{sso}}) = -\frac{2}{3} \frac{\dot{\Omega}_{\text{target}}}{J_2 R_E^2} a^{7/2} (1-e^2)^2 \mu_{\text{Earth}}^{-1/2}$$
For circular SSO at $h = 700\text{ km}$, $i \approx 98.19^\circ$; at $h = 600\text{ km}$, $i \approx 97.79^\circ$.

### 2.4 Eclipse Geometry
For a circular orbit at altitude $h$ with orbit-plane solar beta angle $\beta$:
$$\beta^* = \arcsin\left(\frac{R_E}{R_E + h}\right)$$
When $|\beta| < \beta^*$, the orbit intersects Earth's shadow cone:
$$f_{\text{eclipse}} = \frac{1}{\pi} \arccos\left(\frac{\sqrt{h^2 + 2 R_E h}}{(R_E + h)\cos\beta}\right)$$
For worst-case power sizing, $\beta = 0^\circ$ (orbit plane coplanar with the solar vector). Taking into account operational atmospheric extinction and umbral geometry:
$$f_{\text{eclipse}} \approx 0.369 \quad \text{at } 400\text{ km LEO (matching ISS 34.1 min shadow / 92.6 min orbit)}$$

For high-inclination resonant orbits (such as TESS 2:1 lunar resonant HEO), eclipse exposure is near zero ($f_{\text{eclipse}} \approx 0$), avoiding cold-soak and maintaining continuous solar power.

### 2.5 Ground Station Passes & Optical Ground Track
For a ground station with minimum elevation angle $\epsilon_{\text{min}}$ (standard $10^\circ$):
$$\text{Earth Central Angle Half-Angle: } \lambda = \arccos\left(\frac{R_E}{R_E + h} \cos \epsilon_{\text{min}}\right) - \epsilon_{\text{min}}$$
$$\text{Max Single Pass Duration: } t_{\text{max}} = \frac{2\lambda}{360^\circ} T$$
$$\text{Mean Pass Duration: } t_{\text{mean}} \approx 0.64 \cdot t_{\text{max}}$$
$$\text{Passes per Day per Station: } N_{\text{pass}} \approx 2 \cdot N_{\text{day}} \cdot \left(\frac{\lambda}{180^\circ}\right) \cdot k_{\text{lat}}$$
Where $k_{\text{lat}} \approx 1.25$ accounts for convergence of polar passes in SSO.

Ground Swath $w$ for an optical payload with field-of-view $\theta_{\text{FOV}}$:
$$w = 2 h \tan\left(\frac{\theta_{\text{FOV}}}{2}\right)$$
Ground Sampling Distance (resolution) scaling linearly with altitude:
$$\text{GSD}(h) = \text{GSD}_{\text{ref}} \cdot \left(\frac{h}{h_{\text{ref}}}\right)$$
Global Revisit Time:
$$t_{\text{revisit}} = \frac{2\pi R_E / w}{N_{\text{day}}} \quad [\text{days}]$$

---

## 3. Propulsion Systems & Delta-V Budget (`src/engine/propulsion.ts`)

### 3.1 Tsiolkovsky Rocket Equation
The propellant mass required to execute total mission velocity increment $\Delta v_{\text{total}}$ with effective specific impulse $I_{\text{sp}}$:
$$m_{\text{prop}} = m_{\text{dry}} \left(\exp\left(\frac{\Delta v_{\text{total}}}{I_{\text{sp}} g_0}\right) - 1\right)$$

### 3.2 Delta-V Budget Accounting
Mission delta-v is rolled up from four primary operational components plus a mandatory 10% AIAA margin:
$$\Delta v_{\text{budget}} = (\Delta v_{\text{insertion}} + \Delta v_{\text{sk}} + \Delta v_{\text{disposal}}) \cdot 1.10$$
1. **Orbital Insertion ($\Delta v_{\text{insertion}}$):**
   - $0\text{ m/s}$ if launcher delivers directly to the operational orbit.
   - For GTO to GEO: $\sim 1,500\text{ m/s}$ circularization burn.
   - For TLI to LLO: $\sim 850\text{ m/s}$ lunar orbit insertion.
2. **Station-Keeping ($\Delta v_{\text{sk}}$):**
   - LEO atmospheric drag compensation: $25\text{ m/s/yr}$ ($h < 500\text{ km}$), $12\text{ m/s/yr}$ ($h \approx 700\text{ km}$), $2\text{ m/s/yr}$ ($h > 800\text{ km}$).
   - GEO East-West and North-South corrections: $\sim 50\text{ m/s/yr}$.
   - Halo orbit maintenance at Sun-Earth L1: $\sim 15\text{ m/s/yr}$.
3. **End-of-Life Disposal ($\Delta v_{\text{disposal}}$):**
   - LEO deorbit to perigee $< 60\text{ km}$ for 25-year orbital debris compliance: $\Delta v \approx 60\text{--}180\text{ m/s}$.
   - GEO re-orbit to graveyard $+300\text{ km}$: $\sim 11\text{ m/s}$.

### 3.3 Dry Mass & Propellant Tank Overhead
Propellant tanks add structural mass proportional to the propellant mass stored:
$$m_{\text{tank}} = 0.10 \cdot m_{\text{prop}}$$
Total wet mass is therefore:
$$m_{\text{wet}} = m_{\text{dry}} + m_{\text{prop}} + m_{\text{tank}}$$

Electric propulsion systems (e.g. Hall Effect thrusters, $I_{\text{sp}} = 1,650\text{ s}$) dramatically reduce propellant mass, but their low thrust-to-weight ratio introduces an orbit-raising schedule penalty:
$$\text{Transfer Schedule Overhead: } +2 \text{ to } 4\text{ months}$$

---

## 4. Electrical Power Systems (`src/engine/power.ts`)

### 4.1 Solar Power Generation
Peak electrical power generated by solar arrays in sunlight:
$$P_{\text{sunlit}} = S \cdot \eta_{\text{cell}} \cdot A_{\text{array}} \cdot \cos(\theta_{\text{eff}}) \cdot (1 - \delta_{\text{yr}})^t$$
Where:
- $S$: Solar flux ($1361\text{ W/m}^2$ at 1 AU)
- $\eta_{\text{cell}}$: Cell efficiency (Silicon: 20%, GaAs Triple-Junction: 30%)
- $A_{\text{array}}$: Total array surface area ($\text{m}^2$)
- $\theta_{\text{eff}}$: Effective Sun incidence angle ($15^\circ$ nominal with 1-axis tracking)
- $\delta_{\text{yr}}$: Annual radiation and micrometeoroid degradation rate ($2.5\% / \text{yr}$)
- $t$: Mission operating lifetime ($\text{years}$)

Orbit-Average Generated Power:
$$P_{\text{avg}} = P_{\text{sunlit}} \cdot (1 - f_{\text{eclipse}})$$

### 4.2 Subsystem Power Load
Total bus power demand $P_{\text{load}}$ sums all avionics, communications, ADCS, thermal heaters, and scientific payloads adjusted for duty cycles:
$$P_{\text{load}} = P_{\text{bus}} + P_{\text{adcs}} + P_{\text{fc}} + P_{\text{comms}} \cdot d_{\text{comms}} + \sum (P_{\text{inst}, i} \cdot d_{\text{inst}, i})$$

Power Margin:
$$\text{Margin} = \frac{P_{\text{avg}} - P_{\text{load}}}{P_{\text{avg}}} \times 100\%$$
- Minimum acceptable margin: $15\%$
- Nominal design target: $20\%\text{--}30\%$

### 4.3 Battery Storage & Depth-of-Discharge (DoD)
During orbital eclipse of duration $t_{\text{eclipse}}$, battery energy storage supplies the total electrical load:
$$E_{\text{eclipse}} = P_{\text{load}} \cdot \left(\frac{t_{\text{eclipse}}}{3600}\right) \quad [\text{Watt-hours}]$$

Required Installed Battery Capacity:
$$C_{\text{battery}} = \frac{E_{\text{eclipse}}}{\text{DoD}_{\text{max}}}$$

Depth-of-Discharge limits enforced by mission orbit regime:
| Orbit Regime | Max Allowable DoD | Typical Annual Cycles | Battery Technology Life |
| :--- | :--- | :--- | :--- |
| Low Earth Orbit (LEO / SSO) | $30\%$ ($0.30$) | $\sim 5,500\text{ cycles/yr}$ | 30,000 cycles at 30% DoD |
| Medium / Highly Eccentric Orbit (MEO / HEO) | $50\%$ ($0.50$) | $\sim 700\text{ cycles/yr}$ | 8,000 cycles at 50% DoD |
| Geostationary Orbit (GEO) & Deep Space | $60\%$ ($0.60$) | $\sim 90\text{ cycles/yr}$ | 2,000 cycles at 60% DoD |

Cycle Life Wear Check:
$$\text{Cycles}_{\text{lifetime}} = N_{\text{day}} \cdot 365.25 \cdot t_{\text{life}}$$
If $\text{Cycles}_{\text{lifetime}} > \text{CycleLife}(\text{DoD})$, the battery limits mission longevity.

---

## 5. Telecommunications & Data Architecture (`src/engine/comms.ts`)

### 5.1 Science Data Generation
Daily raw telemetry generated by payload instruments:
$$V_{\text{day}} = \sum_{i} \left(\frac{\text{Rate}_{i} [\text{Mbps}] \cdot d_{i} \cdot 86400}{8 \times 1000}\right) \quad [\text{Gigabytes / day}]$$

### 5.2 Downlink Capacity
Contact time per day is determined by ground network passes:
$$t_{\text{contact}} = N_{\text{passes/day}} \cdot t_{\text{pass, mean}} \quad [\text{seconds / day}]$$
Downlink throughput capacity accounting for Reed-Solomon / LDPC framing overhead and link efficiency ($\eta_{\text{link}} = 0.80$):
$$V_{\text{downlink}} = \frac{R_{\text{downlink}} [\text{Mbps}] \cdot t_{\text{contact}} \cdot 0.80}{8 \times 1000} \quad [\text{Gigabytes / day}]$$

### 5.3 Data Return Fraction & Storage Sizing
$$\text{Data Return Fraction} = \min\left(1.0, \frac{V_{\text{downlink}}}{V_{\text{day}}}\right)$$
If $V_{\text{downlink}} < V_{\text{day}}$, onboard storage buffers overflow, causing irreversible science data loss.

Storage Buffer Sizing:
$$t_{\text{buffer}} = \frac{\text{Capacity}_{\text{storage}} [\text{GB}]}{V_{\text{day}} [\text{GB/day}]} \quad [\text{days}]$$
Missions require at least 1.5 to 3.0 days of autonomous storage to bridge solar storms, ground station maintenance, and orbit passes.

### 5.4 Deep Space Link Friis Transmission Law
For deep-space communications (Sun-Earth L1, Lunar, Mars), link capacity scales with inverse-square distance:
$$P_r \propto P_t G_t G_r \left(\frac{c}{4\pi d f}\right)^2$$
DSN High Gain Antennas (HGA) maintain continuous scheduled downlink windows ($4\text{ hours/day}$ standard) with ground apertures up to $70\text{ m}$.

---

## 6. Thermal & Space Radiation Environment (`src/engine/thermal-radiation.ts`)

### 6.1 Thermal Dissipation & Cryocooling
Internal electronics dissipate nearly 100% of consumed electrical power as waste heat. Radiator mass and thermal louvers scale with internal heat generation:
$$m_{\text{thermal}} = m_{\text{base}} + 0.08 \cdot P_{\text{load}} \quad [\text{kg}]$$
Infrared payloads (e.g. thermal infrared imagers) require closed-cycle Stirling / pulse-tube cryocoolers operating at $60\text{--}80\text{ K}$, demanding an extra $+45\text{ W}$ continuous electrical load and $+15\text{ kg}$ cold-head mass.

### 6.2 Total Ionizing Dose (TID) Radiation Environment
Annual radiation exposure behind standard spacecraft shielding ($3\text{ mm}$ aluminum equivalent, $\sim 0.81\text{ g/cm}^2$):
| Orbit Class | Annual Dose Rate ($\text{krad(Si)} / \text{yr}$) | Primary Radiation Hazard |
| :--- | :--- | :--- |
| Low Earth Orbit (LEO, $500\text{ km}$, $51.6^\circ$) | $0.5$ | South Atlantic Anomaly (SAA) protons |
| Sun-Synchronous (SSO, $700\text{ km}$, $98.2^\circ$) | $1.5$ | SAA + auroral trapped electrons |
| Medium Earth Orbit (MEO, $20,200\text{ km}$) | $15.0$ | Heart of Van Allen outer electron belts |
| Geostationary Orbit (GEO, $35,786\text{ km}$) | $5.0$ | Outer trapped electrons + solar proton events |
| Lunar-Resonant HEO (TESS P/2) | $20.0$ | Periodic deep Van Allen belt crossings |
| Sun-Earth L1 Halo | $3.0$ | Galactic cosmic rays + solar energetic particles |
| Low Lunar Orbit (LLO, $100\text{ km}$) | $2.0$ | Solar wind protons + lunar albedo neutrons |
| Low Mars Orbit (LMO, $400\text{ km}$) | $1.5$ | Unshielded interplanetary GCR background |

### 6.3 Multi-Mechanism Lifetime Evaluation
Total projected mission operating lifespan is governed by the minimum of five independent degradation modes:
$$\text{Lifespan} = \min(t_{\text{propellant}}, t_{\text{battery}}, t_{\text{array}}, t_{\text{radiation}}, t_{\text{drag}})$$
1. **$t_{\text{propellant}}$:** Usable propellant divided by annual station-keeping and disposal burn rate.
2. **$t_{\text{battery}}$:** Cycle life rating divided by annual orbital cycles.
3. **$t_{\text{array}}$:** Time until cumulative degradation drops generated power below minimum bus load.
4. **$t_{\text{radiation}}$:** $\min_i(\text{TID}_{\text{tolerance}, i}) / \text{DoseRate}_{\text{orbit}}$.
5. **$t_{\text{drag}}$:** Passive orbital decay table based on atmospheric density at perigee.

The engine identifies and surfaces the specific primary limiter to the player.

---

## 7. Mass Properties & Growth Allowances (`src/engine/mass.ts`)

### 7.1 Mass Growth Allowance (AIAA S-120-2006 Standard)
In accordance with aerospace systems engineering standards, developmental mass growth allowance (MGA) is applied based on average Technology Readiness Level (TRL):
$$\text{Average TRL} = \frac{1}{N} \sum_{i=1}^{N} \text{TRL}_i$$
$$\text{MGA Percentage} = \begin{cases} 
20\% & \text{if } \text{Avg TRL} < 6 \text{ (Concept / Breadboard)} \\ 
15\% & \text{if } 6 \le \text{Avg TRL} < 7 \text{ (Engineering Model)} \\ 
10\% & \text{if } \text{Avg TRL} \ge 7 \text{ (Flight Proven)} 
\end{cases}$$

Total Spacecraft Dry Mass:
$$m_{\text{dry}} = (m_{\text{bus}} + m_{\text{payload}} + m_{\text{subsystems}}) \cdot (1 + \text{MGA})$$

### 7.2 Launch Vehicle Lift Capacity & Fairing Clearance
- Wet Mass Limit: $m_{\text{wet}} \le \text{Capacity}_{\text{launcher}}(\text{OrbitClass})$
- Fairing Envelope: $D_{\text{bus}} \le D_{\text{fairing}} - 0.2\text{ m}$ (acoustic dynamic envelope margin).

---

## 8. Parametric Cost, Schedule, and Risk Models (`src/engine/cost-schedule.ts`)

### 8.1 Parametric Lifecycle Cost
Spacecraft lifecycle cost accounts for hardware procurement, integration complexity, launch vehicle pricing, ground network fees, and operational mission support:
$$\text{Hardware Cost} = C_{\text{bus, base}} + \sum C_{\text{component}} + \sum C_{\text{instrument}}$$
$$\text{Integration Multiplier} = 1 + 0.35 \cdot \text{ComplexityFactor}$$
$$\text{Total Cost} = \text{Hardware Cost} \cdot \text{Integration Multiplier} + C_{\text{launcher}} + (C_{\text{ops/yr}} + C_{\text{net/yr}}) \cdot t_{\text{designLife}}$$

### 8.2 Concurrent Schedule Model
Program schedule is modeled using concurrent path engineering. Parallel subsystems develop concurrently; the longest developmental critical path dictates the schedule:
$$\text{Subsystem Lead Time} = \max\left(0, (7 - \text{TRL}_i) \cdot 4\right) \quad [\text{months}]$$
$$\text{Total Schedule} = t_{\text{bus, base}} + \max_i(\text{Subsystem Lead Time}_i) \quad [\text{months}]$$

### 8.3 Composite Risk Index (0 to 100)
Risk scores represent mission vulnerability across four risk dimensions:
1. **TRL Risk ($0\text{--}35\text{ pts}$):** Heavily penalizes components with TRL $< 6$.
2. **Mass & Power Margin Risk ($0\text{--}30\text{ pts}$):** Penalizes power margins $< 15\%$ and dry mass margins $< 10\%$.
3. **Launcher Track Record ($0\text{--}20\text{ pts}$):** $(1 - \text{LauncherReliability}) \times 100$.
4. **Radiation Exposure ($0\text{--}15\text{ pts}$):** High dose rates relative to component hardness.

Risk classification:
- $0\text{--}24$: LOW (High confidence, flight proven)
- $25\text{--}49$: MODERATE (Standard aerospace development risk)
- $50\text{--}74$: HIGH (Tight margins, low-TRL payloads)
- $75\text{--}100$: CRITICAL (High failure probability)

---

## 9. Science Value & Debrief Evaluation (`src/engine/science.ts`)

Science score ($0\text{ to }1000\text{ points}$) evaluates scientific utility through multiplicative fitness factors:
$$\text{Score} = \sum_{i} \left[ V_{\text{base}, i} \cdot F_{\text{orbit}} \cdot F_{\text{comms}} \cdot F_{\text{req}} \cdot \min\left(1, \frac{t_{\text{life}}}{t_{\text{target}}}\right)^{0.7} \right]$$
Where:
- $F_{\text{orbit}}$: Orbit fitness factor (e.g. transit photometers score $0.95$ in lunar-resonant HEO but only $0.55$ in LEO due to Earth limb occultation and thermal thermal swings).
- $F_{\text{comms}}$: Downlink return fraction ($V_{\text{downlink}} / V_{\text{day}}$).
- $F_{\text{req}}$: Scenario requirements satisfaction factor ($0.0\text{ to }1.0$).
- Letter grades: $\ge 900 \to \text{S}$, $\ge 780 \to \text{A}$, $\ge 640 \to \text{B}$, $\ge 480 \to \text{C}$, $< 480 \to \text{F}$.

---

## 10. Seeded Launch Simulation (`src/engine/launch.ts` & `src/engine/rng.ts`)

Launch outcome is strictly deterministic for a given mission seed and design configuration:
- PRNG: Mulberry32 32-bit stateful generator seeded with a 32-bit hash of mission design and seed code (`MF-XXXX-XX`).
- Effective Probability:
  $$P_{\text{success}} = \text{Reliability}_{\text{launcher}} \cdot (1 - 0.003 \cdot \text{RiskScore})$$
  Clamped between $0.05$ and $0.99$.
- Outcome: $\text{Success}$ if $\text{Roll} \le P_{\text{success}}$, else $\text{Failure}$.
- Failure attribution isolates launcher stage failure vs design-driven payload/fairing structural failure.

---

## 11. Aerospace Validation Engine (`src/engine/validate.ts`)

Thirteen discrete engineering rules check design validity:
1. `mass-launcher-exceeded`: Wet mass vs launcher lift limit.
2. `mass-bus-exceeded`: Dry mass vs bus chassis limit.
3. `mass-fairing-exceeded`: Bus diameter vs fairing envelope.
4. `power-margin-negative`: Generation vs subsystem load.
5. `battery-capacity-insufficient`: Storage Wh vs eclipse demand.
6. `propulsion-dv-insufficient`: Propellant $\Delta v$ vs budget.
7. `adcs-pointing-insufficient`: Pointing accuracy vs payload requirement.
8. `comms-downlink-deficit`: Downlink capacity vs data generation.
9. `storage-buffer-deficit`: Onboard buffer storage days.
10. `thermal-cryocooler-missing`: IR instrument active refrigeration check.
11. `radiation-lifetime-exceeded`: TID dose vs component hardness.
12. `cost-budget-exceeded`: Lifecycle cost vs scenario budget cap (waived in Sandbox).
13. `schedule-deadline-exceeded`: Lead time vs deadline months (waived in Sandbox).

Every rule returns a plain-language physics explanation (`why`), actual vs limit metrics (`cause`), and a machine-applicable state patch (`fixes`).

---

## 12. References & Standards Citations

1. Larson, W. J., & Wertz, J. R. (1999). *Space Mission Analysis and Design (SMAD)* (3rd ed.). Microcosm Press / Springer.
2. Vallado, D. A. (2013). *Fundamentals of Astrodynamics and Applications* (4th ed.). Microcosm Press.
3. NASA. (2016). *NASA Systems Engineering Handbook* (NASA/SP-2016-6105 Rev 2). National Aeronautics and Space Administration.
4. European Cooperation for Space Standardization. (2009). *ECSS-E-ST-10C: System Engineering General Requirements*. ESA Requirements & Standards Division.
5. American Institute of Aeronautics and Astronautics. (2006). *AIAA S-120-2006: Mass Properties Control for Space Systems*. AIAA.
6. Rauschenbakh, B. V., Ovchinnikov, M. Y., & McKenna-Lawlor, S. (2003). *Essential Spaceflight Dynamics and Magnetospherics*. Springer.
