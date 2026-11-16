/**
 * Meridian Space Authority (MSA) Campaign Chapters: Acts 0, I, and II
 * 
 * Setting: Year 2041. Following the tragic loss of the Meridian-1 flagship,
 * the player is appointed Mission Director to restore orbital capability,
 * scientific prestige, and public trust.
 */

import type { CampaignChapter } from "./types";

export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  // PROLOGUE: THE ACADEMY
  {
    id: "prologue",
    act: 0,
    order: 0,
    title: "Prologue: Induction",
    subtitle: "Meridian Space Flight Academy",
    briefingDate: "January 12, 2041",
    summary: "Report to Director Okafor at the Meridian Flight Operations Center to undergo flight controller certification.",
    linkedScenarioId: "earth-watch",
    rewards: {
      xp: 250,
      reputation: { science: 5, public: 5, treasury: 5 },
    },
    briefing: {
      startNodeId: "node-1",
      nodes: {
        "node-1": {
          type: "say",
          speaker: "okafor",
          text: "Welcome to Meridian Flight Operations, Director. I won't sugarcoat the situation: the loss of our flagship three months ago shattered public confidence and triggered intense oversight from the Treasury. You were chosen because you understand systems discipline.",
          nextNodeId: "node-2",
        },
        "node-2": {
          type: "say",
          speaker: "arai",
          text: "Chief Engineer Arai here. The hardware doesn't care about politics, Director. It cares about mass, thermal equilibrium, and battery depth-of-discharge. If your numbers don't balance on the pad, you won't clear my console.",
          nextNodeId: "node-3",
        },
        "node-3": {
          type: "choice",
          prompt: "How do you frame your flight command philosophy?",
          options: [
            {
              label: "Engineering rigor first. We never launch without safety margin.",
              description: "Focus on structural reliability and redundancy.",
              effects: { rep: { treasury: -2, public: 3 }, budgetDeltaM: 5 },
              nextNodeId: "node-rigor",
            },
            {
              label: "Frugal efficiency. We prove that science doesn't require wasteful spending.",
              description: "Appease Treasury oversight with lean architectures.",
              effects: { rep: { treasury: 5, science: -2 }, budgetDeltaM: -5 },
              nextNodeId: "node-frugal",
            },
            {
              label: "Scientific discovery. Our primary mandate is returning breakthrough telemetry.",
              description: "Maximize instrument throughput and sensor capability.",
              effects: { rep: { science: 5, treasury: -3 } },
              nextNodeId: "node-science",
            },
          ],
        },
        "node-rigor": {
          type: "say",
          speaker: "arai",
          text: "Music to my ears. Keep your mass growth margin above 15% and I'll make sure your flight computers never crash.",
          nextNodeId: "node-conclude",
        },
        "node-frugal": {
          type: "say",
          speaker: "hale",
          text: "A refreshing perspective from a flight director. Deliver under budget, and the council will fund your future lunar aspirations.",
          nextNodeId: "node-conclude",
        },
        "node-science": {
          type: "say",
          speaker: "ferreira",
          text: "Exactly what I wanted to hear. Spacecraft exist to collect data, not just to look pretty in orbit. Let's get our sensors aloft.",
          nextNodeId: "node-conclude",
        },
        "node-conclude": {
          type: "say",
          speaker: "okafor",
          text: "Your flight clearance is authorized. Complete your pre-flight orientation in the workspace and let's put Meridian back in the black.",
        },
      },
    },
    epilogue: {
      success: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "okafor",
            text: "Exemplary execution. Telemetry locks established and flight verification complete. You're officially cleared for Act I orbital operations.",
          },
        },
      },
      partial: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "arai",
            text: "You squeaked by, but your power margins were razor thin. Tighten up the solar calculations before our next launch.",
          },
        },
      },
      failure: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "hale",
            text: "Launch scrubbed due to unresolved constraints. The council expects better accountability. Recalibrate and try again.",
          },
        },
      },
    },
  },

  // ACT I - CHAPTER 1: FIRST LIGHT
  {
    id: "ch-1",
    act: 1,
    order: 1,
    title: "Act I - Chapter 1: First Light",
    subtitle: "Low Earth Orbit Cubesat Demonstrator",
    briefingDate: "March 3, 2041",
    summary: "Deploy a small subscale optical cubesat to 500 km LEO to demonstrate revived telemetry and communication ground links.",
    linkedScenarioId: "earth-watch",
    rewards: {
      xp: 500,
      reputation: { science: 10, public: 10, treasury: 5 },
      unlockScenarioId: "deep-space-telescope",
    },
    briefing: {
      startNodeId: "node-1",
      nodes: {
        "node-1": {
          type: "say",
          speaker: "okafor",
          text: "This is our return-to-flight mission: 'First Light'. The global press will be watching the countdown. We need a clean, stable orbit at 500 km altitude.",
          nextNodeId: "node-2",
        },
        "node-2": {
          type: "say",
          speaker: "ferreira",
          text: "I've mounted an entry-level optical spectrometer on the bus. All we need is clean downlink passes over our ground stations to validate the sensor calibration.",
          nextNodeId: "node-3",
        },
        "node-3": {
          type: "choice",
          prompt: "Select launch vehicle allocation strategy:",
          options: [
            {
              label: "Book a dedicated small-lift launcher (Electron) for precise orbital timing.",
              description: "Higher cost but zero scheduling delay.",
              effects: { rep: { treasury: -4, public: 4 }, budgetDeltaM: 6 },
              nextNodeId: "node-dedicated",
            },
            {
              label: "Rideshare on a commercial medium-lift booster (Falcon 9).",
              description: "Lower launch cost with shared orbital drop.",
              effects: { rep: { treasury: 5, science: -1 } },
              nextNodeId: "node-rideshare",
            },
          ],
        },
        "node-dedicated": {
          type: "say",
          speaker: "okafor",
          text: "Dedicated launcher confirmed. Flight slot locked. You have the green light for countdown.",
        },
        "node-rideshare": {
          type: "say",
          speaker: "hale",
          text: "Prudent decision. Every dollar saved here goes toward our deep-space radar reserves.",
        },
      },
    },
    epilogue: {
      success: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "okafor",
            text: "Telemetry confirms nominal orbit insertion! The carrier signal came through loud and clear on the Madrid ground station. First Light is an unqualified success.",
          },
        },
      },
      partial: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "ferreira",
            text: "We acquired the orbit, but antenna pointing errors degraded our data throughput by 30%. Still, the bus survived.",
          },
        },
      },
      failure: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "arai",
            text: "Flight computer experienced watchdog reset during fairing separation. Review the telemetry log and redesign the avionics bus.",
          },
        },
      },
    },
  },

  // ACT I - CHAPTER 2: WATCHING THE FIRE
  {
    id: "ch-2",
    act: 1,
    order: 2,
    title: "Act I - Chapter 2: Cosmic Origins",
    subtitle: "High-Sensitivity Cryogenic Infrared Observatory",
    briefingDate: "June 22, 2041",
    summary: "Insert an active cryogenic observatory into high orbit to detect faint thermal infrared signatures across deep space.",
    linkedScenarioId: "deep-space-telescope",
    rewards: {
      xp: 750,
      reputation: { science: 15, public: 15, treasury: 5 },
      unlockScenarioId: "space-weather-sentinel",
    },
    briefing: {
      startNodeId: "node-1",
      nodes: {
        "node-1": {
          type: "say",
          speaker: "okafor",
          text: "Director, severe heatwaves across the Mediterranean and boreal forests have triggered widespread fires. The UN Climate Council has requested real-time thermal coverage.",
          nextNodeId: "node-2",
        },
        "node-2": {
          type: "say",
          speaker: "ferreira",
          text: "We must fly the Thermal Infrared Sensor (TIRS). It requires active cryogenic cooling down to 77 Kelvin. If the cooler loses power, the detectors saturate and become blind.",
          nextNodeId: "node-3",
        },
        "node-3": {
          type: "say",
          speaker: "arai",
          text: "Cryocoolers pull continuous power. You'll need high-efficiency GaAs solar arrays and a battery bank capable of carrying the cryo load through the 35-minute orbital eclipse.",
          nextNodeId: "node-4",
        },
        "node-4": {
          type: "choice",
          prompt: "How do you balance the cryocooler electrical architecture?",
          options: [
            {
              label: "Install oversized triple-junction arrays with dual redundant batteries.",
              description: "Guarantees continuous cryo cooling at the cost of higher launch mass.",
              effects: { rep: { science: 5, treasury: -3 } },
              nextNodeId: "node-power-heavy",
            },
            {
              label: "Duty-cycle the cryocooler during eclipse to save mass and cost.",
              description: "Requires stabilization settling time after each orbital sunrise.",
              effects: { rep: { treasury: 5, science: -4 } },
              nextNodeId: "node-duty-cycle",
            },
          ],
        },
        "node-power-heavy": {
          type: "say",
          speaker: "arai",
          text: "A robust design. Heavy, but it will sleep soundly through the eclipse shadow.",
        },
        "node-duty-cycle": {
          type: "say",
          speaker: "ferreira",
          text: "We'll lose night-side observation frames, but if the budget cap requires it, my team will adapt our imaging passes.",
        },
      },
    },
    epilogue: {
      success: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "okafor",
            text: "Fire & Ice telemetry is broadcasting worldwide! Emergency responders credited our infrared scans with saving three townships overnight. Public appreciation is through the roof.",
          },
        },
      },
      partial: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "arai",
            text: "Thermal drift was higher than modeled, but the cryogenic loop remained pressurized. Good enough for provisional certification.",
          },
        },
      },
      failure: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "ferreira",
            text: "The cryocooler shut down on orbit 3 due to battery undervoltage. The detectors overheated. A painful loss of irreplaceable data.",
          },
        },
      },
    },
  },

  // ACT I - CHAPTER 3: THE QUIET SUN
  {
    id: "ch-3",
    act: 1,
    order: 3,
    title: "Act I - Chapter 3: The Quiet Sun",
    subtitle: "Lagrange-1 Space Weather Sentinel",
    briefingDate: "October 18, 2041",
    summary: "Navigate 1.5 million kilometers sunward to the Sun-Earth L1 Lagrange point to monitor coronal mass ejections before they strike Earth.",
    linkedScenarioId: "space-weather-sentinel",
    rewards: {
      xp: 1000,
      reputation: { science: 20, public: 10, treasury: 10 },
      unlockScenarioId: "exoplanet-hunter",
    },
    briefing: {
      startNodeId: "node-1",
      nodes: {
        "node-1": {
          type: "say",
          speaker: "okafor",
          text: "Solar Cycle 26 is ramping up faster than predicted. Space Weather Sentinel will be our first platform outside Earth's magnetosphere, stationed 1.5 million km away at L1.",
          nextNodeId: "node-2",
        },
        "node-2": {
          type: "say",
          speaker: "arai",
          text: "Out there, you have zero magnetic shielding. Cosmic rays and solar proton events will hammer the electronics. Radiation tolerance must exceed 75 krad, or your flight computer will suffer fatal single-event upsets.",
          nextNodeId: "node-3",
        },
        "node-3": {
          type: "choice",
          prompt: "Determine radiation protection architecture:",
          options: [
            {
              label: "Equip rad-hardened ceramic avionics and 5mm tantalum spot shielding.",
              description: "High reliability against extreme solar flares.",
              effects: { rep: { science: 5, treasury: -4 } },
              nextNodeId: "node-radhard",
            },
            {
              label: "Use commercial off-the-shelf triple-redundant voted microprocessors.",
              description: "Significantly cheaper but vulnerable to latch-up during X-class events.",
              effects: { rep: { treasury: 6, public: -2 } },
              nextNodeId: "node-cots",
            },
          ],
        },
        "node-radhard": {
          type: "say",
          speaker: "arai",
          text: "A fortress in deep space. When the next coronal mass ejection blows, our console will stay alive while others reboot.",
        },
        "node-cots": {
          type: "say",
          speaker: "hale",
          text: "The budget committee commends your cost discipline. Let's hope the Sun behaves itself during transit.",
        },
      },
    },
    epilogue: {
      success: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "okafor",
            text: "L1 halo insertion achieved! The coronagraph is streaming high-resolution solar imagery back to Earth. Act I is complete, Director. The council has formally authorized our Lunar program!",
          },
        },
      },
      partial: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "ferreira",
            text: "Solar wind telemetry is nominal, though station-keeping maneuvers consumed 10% more hydrazine than planned.",
          },
        },
      },
      failure: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "arai",
            text: "Flight computer suffered memory latch-up during cruise phase. Spacecraft drifted past the L1 capture window.",
          },
        },
      },
    },
  },

  // ACT II - CHAPTER 4: EYES ON DISTANT SUNS
  {
    id: "ch-4",
    act: 2,
    order: 4,
    title: "Act II - Chapter 4: Eyes on Distant Suns",
    subtitle: "High Lunar-Resonant Exoplanet Observatory",
    briefingDate: "March 8, 2042",
    summary: "Establish a wide-field photometric transit hunter in high lunar-resonant orbit to survey nearby M-dwarf habitable zones.",
    linkedScenarioId: "exoplanet-hunter",
    rewards: {
      xp: 1250,
      reputation: { science: 25, public: 15, treasury: 5 },
      unlockScenarioId: "lunar-pathfinder",
    },
    briefing: {
      startNodeId: "node-1",
      nodes: {
        "node-1": {
          type: "say",
          speaker: "ferreira",
          text: "This is the flagship science mission I've waited five years for, Director. We are deploying a 4-camera wide-field transit photometer into a 2:1 lunar-resonant orbit. Ultra-stable thermal conditions, zero Earth occultation.",
          nextNodeId: "node-2",
        },
        "node-2": {
          type: "say",
          speaker: "arai",
          text: "Detecting a 0.01% dip in stellar brightness requires arcsecond pointing precision. If your reaction wheels have any mechanical jitter, the photometry is ruined. You need fine star trackers.",
          nextNodeId: "node-3",
        },
        "node-3": {
          type: "choice",
          prompt: "Select attitude stabilization configuration:",
          options: [
            {
              label: "High-precision micro-vibration isolated reaction wheels + dual star trackers.",
              description: "Delivers sub-arcsecond stabilization for pristine photometric curves.",
              effects: { rep: { science: 6, treasury: -3 } },
              nextNodeId: "node-wheels",
            },
            {
              label: "Standard reaction wheels with magnetic torque rod desaturation.",
              description: "Less expensive, but torque rods are weak in high lunar-resonant orbit.",
              effects: { rep: { treasury: 5, science: -5 } },
              nextNodeId: "node-standard",
            },
          ],
        },
        "node-wheels": {
          type: "say",
          speaker: "ferreira",
          text: "With that precision, we won't just find super-Earths; we'll characterize their atmospheres.",
        },
        "node-standard": {
          type: "say",
          speaker: "arai",
          text: "At 100,000 km, Earth's magnetic field is negligible. Torque rods won't dump wheel momentum out there. You'll need RCS thrusters.",
        },
      },
    },
    epilogue: {
      success: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "ferreira",
            text: "First light photometrics have confirmed three terrestrial transits in the TRAPPIST system! The global astrophysical community is stunned. Meridian is leading human exoplanet discovery.",
          },
        },
      },
      partial: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "okafor",
            text: "Orbit established and primary targets tracked, but pointing jitter reduced detection sensitivity to giant planets only.",
          },
        },
      },
      failure: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "arai",
            text: "Reaction wheel saturation caused uncommanded spacecraft tumble. All science observations aborted.",
          },
        },
      },
    },
  },

  // ACT II - CHAPTER 5: PATHFINDER
  {
    id: "ch-5",
    act: 2,
    order: 5,
    title: "Act II - Chapter 5: Lunar Pathfinder",
    subtitle: "Low Lunar Polar Mapping Reconnaissance",
    briefingDate: "September 15, 2042",
    summary: "Execute Translunar Injection (TLI), perform Lunar Orbit Insertion (LOI), and map polar craters to locate water ice deposits for future surface landings.",
    linkedScenarioId: "lunar-pathfinder",
    rewards: {
      xp: 1500,
      reputation: { science: 25, public: 25, treasury: 15 },
    },
    briefing: {
      startNodeId: "node-1",
      nodes: {
        "node-1": {
          type: "say",
          speaker: "okafor",
          text: "This is the culmination of Stage 2, Director: Lunar Pathfinder. Everything we've built leads here. We are sending an orbital surveyor to the Moon's South Pole.",
          nextNodeId: "node-2",
        },
        "node-2": {
          type: "say",
          speaker: "arai",
          text: "Translunar Injection requires 3,150 m/s delta-v, followed by another 850 m/s for Lunar Orbit Insertion. You'll need high-performance bipropellant or ion propulsion, and sufficient wet mass to handle the deceleration.",
          nextNodeId: "node-3",
        },
        "node-3": {
          type: "say",
          speaker: "hale",
          text: "The stakes could not be higher. If Pathfinder finds accessible water ice in Shackleton Crater, the International Coalition will fund a permanent manned lunar base.",
          nextNodeId: "node-4",
        },
        "node-4": {
          type: "choice",
          prompt: "Determine lunar propulsion and trajectory profile:",
          options: [
            {
              label: "High-thrust storable hypergolic bipropellant stage (fast 3-day direct transfer).",
              description: "Proven high-reliability insertion burn with immediate capture.",
              effects: { rep: { public: 5, treasury: -4 } },
              nextNodeId: "node-biprop",
            },
            {
              label: "Low-thrust solar electric Hall thruster stage (efficient 3-month ballistic transfer).",
              description: "Mass-efficient with massive propellant savings, but prolonged cruise.",
              effects: { rep: { treasury: 6, public: -3 } },
              nextNodeId: "node-electric",
            },
          ],
        },
        "node-biprop": {
          type: "say",
          speaker: "okafor",
          text: "Direct transfer approved. Three days to the Moon. Mission Control is ready on your command.",
        },
        "node-electric": {
          type: "say",
          speaker: "arai",
          text: "High-specific impulse is an elegant choice. Spiral transfer verified; tracking antennas stand by.",
        },
      },
    },
    epilogue: {
      success: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "okafor",
            text: "LUNAR ORBIT INSERTION CONFIRMED! Pathfinder has captured into a 100 km polar orbit! Radar sounders indicate thick subsurface water ice in the permanently shadowed regions. You have proven Meridian's engineering supremacy.\n\n[CONGRATULATIONS: ORBITAL RECONNAISSANCE COMPLETED]\nProceed to Chapter 6: 'Touchdown' for the final powered descent to the lunar surface!",
          },
        },
      },
      partial: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "arai",
            text: "Insertion burn underperformed due to propellant line cavitation. Spacecraft captured into high elliptical orbit instead of circular 100 km polar.",
          },
        },
      },
      failure: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "okafor",
            text: "Lunar insertion burn failed to ignite. Spacecraft sailed past the Moon into heliocentric graveyard orbit.",
          },
        },
      },
    },
  },

  // ACT II - CHAPTER 6: TOUCHDOWN
  {
    id: "ch-6",
    act: 2,
    order: 6,
    title: "Act II - Chapter 6: Touchdown",
    subtitle: "Shackleton Crater Terminal Powered Descent",
    briefingDate: "December 21, 2042",
    summary: "Execute the critical deorbit braking burn, transition through High Gate at 2,000 meters, and soft-land the Artemis Shackleton Lander beside the lunar South Pole ice traps.",
    linkedScenarioId: "lunar-south-pole",
    rewards: {
      xp: 2500,
      reputation: { science: 35, public: 35, treasury: 25 },
    },
    briefing: {
      startNodeId: "node-1",
      nodes: {
        "node-1": {
          type: "say",
          speaker: "okafor",
          text: "This is the signature moment of the Meridian program, Director: Touchdown. Lunar Pathfinder mapped the terrain; now we put boots and instruments on the regolith.",
          nextNodeId: "node-2",
        },
        "node-2": {
          type: "say",
          speaker: "arai",
          text: "Terminal powered descent is unforgiving. You enter High Gate at 2,000 meters altitude with 100 m/s forward speed. Your propellant budget must account for orbital braking plus hover margin. Touch down faster than 3.5 m/s or tilt past 15 degrees, and the legs will shear.",
          nextNodeId: "node-3",
        },
        "node-3": {
          type: "say",
          speaker: "hale",
          text: "The civilian council is watching live across three continents. A flawless touchdown unlocks Act III deep-space exploration to Mars and beyond. Keep your eyes on the radar altimeter.",
          nextNodeId: "node-4",
        },
        "node-4": {
          type: "choice",
          prompt: "Select landing flight control doctrine:",
          options: [
            {
              label: "Closed-loop autonomous autopilot with Terrain-Relative Navigation.",
              description: "Vector acceleration guidance targeting the optimal safe plateau.",
              effects: { rep: { science: 5, treasury: -2 } },
              nextNodeId: "node-auto",
            },
            {
              label: "Pilot command authority with assisted rate damping.",
              description: "Manual throttle control with attitude stability assistance.",
              effects: { rep: { public: 6, science: -1 } },
              nextNodeId: "node-manual",
            },
          ],
        },
        "node-auto": {
          type: "say",
          speaker: "arai",
          text: "Autonomous guidance program loaded. Computer has flight control. Monitor radar lock closely.",
        },
        "node-manual": {
          type: "say",
          speaker: "okafor",
          text: "Manual stick authority granted. Watch your sink rate and propellant reserve. Bring her home.",
        },
      },
    },
    epilogue: {
      success: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "okafor",
            text: "CONTACT LIGHT! TOUCHDOWN CONFIRMED! Meridian Base is on the surface of the Moon! Surface instruments report cryogenic water ice in the regolith. You have achieved immortality in aerospace history.",
          },
        },
      },
      partial: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "arai",
            text: "Hard touchdown near crater rim. One landing strut collapsed on boulder ejecta, but payload chassis and antenna are operational.",
          },
        },
      },
      failure: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "hale",
            text: "Telemetry lost on terminal descent. Impact velocity exceeded structural limits. The council demands an immediate safety board inquiry.",
          },
        },
      },
    },
  },
];
