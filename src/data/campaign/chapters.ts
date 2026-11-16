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
            text: "CONTACT LIGHT! TOUCHDOWN CONFIRMED! Meridian Base is on the surface of the Moon! Surface instruments report cryogenic water ice in the regolith. You have achieved immortality in aerospace history.\n\n[ACT II COMPLETED]: The Lunar Gateway is secured! Proceed to Act III: Worlds to conquer Mars, Venus, Europa, and Titan!",
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

  // ACT III - CHAPTER 7: RED DUST
  {
    id: "ch-7",
    act: 3,
    order: 7,
    title: "Act III - Chapter 7: Red Dust",
    subtitle: "Jezero Crater Atmospheric Entry & Touchdown",
    briefingDate: "March 14, 2043",
    summary: "Navigate the harrowing 'Seven Minutes of Terror' through the thin Martian atmosphere, deploying a supersonic parachute and firing terminal retro-rockets to touch down inside Jezero Crater.",
    linkedScenarioId: "mars-landing",
    rewards: {
      xp: 3000,
      reputation: { science: 30, public: 30, treasury: 20 },
    },
    briefing: {
      startNodeId: "node-1",
      nodes: {
        "node-1": {
          type: "say",
          speaker: "okafor",
          text: "Director, our lunar base is thriving, but the ultimate frontier of our generation has always been Mars. We are dispatching the Meridian Red Dust lander to Jezero Crater.",
          nextNodeId: "node-2",
        },
        "node-2": {
          type: "say",
          speaker: "arai",
          text: "Mars gives you just enough atmosphere to superheat your heat shield, but not enough to slow you down. You must deploy your supersonic parachute between 1,400 and 700 meters, then fire your pulsed retro-rockets to cancel the remaining 80 m/s before touchdown.",
          nextNodeId: "node-3",
        },
        "node-3": {
          type: "say",
          speaker: "ferreira",
          text: "Jezero was a lake 3.5 billion years ago. If microbial life ever emerged on Mars, the clay mudstones in that delta preserved the organic signatures. Deploy the surface drill and bring back pure data.",
          nextNodeId: "node-4",
        },
        "node-4": {
          type: "choice",
          prompt: "Select descent deceleration profile:",
          options: [
            {
              label: "High-drag parachute window with terrain-relative navigation avoidance.",
              description: "Prioritizes aerodynamic braking and automated optical hazard steering.",
              effects: { rep: { science: 5, treasury: -2 } },
              nextNodeId: "node-high-drag",
            },
            {
              label: "Deep propulsive retro-burn with reinforced landing gear.",
              description: "Higher fuel consumption for definitive thrust deceleration on rugged scarps.",
              effects: { rep: { public: 6, science: -2 } },
              nextNodeId: "node-deep-retro",
            },
          ],
        },
        "node-high-drag": {
          type: "say",
          speaker: "arai",
          text: "Parachute release timers verified. Computer will scan crater scarps during descent.",
        },
        "node-deep-retro": {
          type: "say",
          speaker: "okafor",
          text: "Raw rocket deceleration authorized. Fuel margins are tight, but the touchdown is definitive.",
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
            text: "TOUCHDOWN ON THE RED PLANET! The Sky Crane cable has cut cleanly! Telemetry confirms our lander is wheels-down on Jezero Delta. Earth rejoices at our triumph.",
          },
        },
      },
      partial: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "arai",
            text: "Lander touched down on a 14-degree sand scarp. One mobility actuator jammed by abrasive dust, but sample drill and camera are fully operational.",
          },
        },
      },
      failure: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "hale",
            text: "Parachute deployed late in thin air; retro-rockets ignited with insufficient altitude remaining. High-speed impact telemetry recorded.",
          },
        },
      },
    },
  },

  // ACT III - CHAPTER 8: HELL'S NEIGHBOUR
  {
    id: "ch-8",
    act: 3,
    order: 8,
    title: "Act III - Chapter 8: Hell's Neighbour",
    subtitle: "Venus Atmospheric Entry & Acid Cloud Sounding",
    briefingDate: "November 3, 2043",
    summary: "Enter orbit around Venus and drop an armored atmospheric probe through sulfuric acid clouds to sample noble gases and radar-map the boiling surface.",
    linkedScenarioId: "venus-probe",
    rewards: {
      xp: 3200,
      reputation: { science: 35, public: 25, treasury: 20 },
    },
    briefing: {
      startNodeId: "node-1",
      nodes: {
        "node-1": {
          type: "say",
          speaker: "okafor",
          text: "Venus is Earth's twisted twin. At 2,600 W/m² solar flux, thermal management is your greatest challenge. We must learn how a temperate world transformed into a runaway furnace.",
          nextNodeId: "node-2",
        },
        "node-2": {
          type: "say",
          speaker: "arai",
          text: "The surface is 465°C and 92 bars of supercritical carbon dioxide. Your probe needs a spherical titanium pressure hull with phase-change paraffin heat sinks. Solar panels will fry; battery power is your lifespan limit.",
          nextNodeId: "node-3",
        },
        "node-3": {
          type: "say",
          speaker: "hale",
          text: "Treasury questioned funding a probe built to survive less than two hours. But the global semiconductor consortium needs Venusian material science data. Return the gas spectra and the funding will quadruple.",
          nextNodeId: "node-4",
        },
        "node-4": {
          type: "choice",
          prompt: "Select atmospheric sensor priority:",
          options: [
            {
              label: "Deep atmosphere mass spectrometry to resolve ocean isotope ratios.",
              description: "Measures xenon and krypton isotopes to determine ancient water history.",
              effects: { rep: { science: 6, treasury: -2 } },
              nextNodeId: "node-mass-spec",
            },
            {
              label: "High-frequency radar and cloud descent imagery.",
              description: "Pierces cloud haze to image tectonic tessera blocks and active volcanoes.",
              effects: { rep: { public: 5, science: -1 } },
              nextNodeId: "node-radar",
            },
          ],
        },
        "node-mass-spec": {
          type: "say",
          speaker: "ferreira",
          text: "Noble gas ratios unlocked. We will finally know if ancient Venus had blue oceans.",
        },
        "node-radar": {
          type: "say",
          speaker: "okafor",
          text: "Descent radar verified. Let's see beneath those choking clouds.",
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
            text: "SIGNAL RECEIVED THROUGH THE ACID RAIN! The probe completed its full 90-minute descent transect and survived 42 minutes on the surface! Deuterium-to-hydrogen ratios prove Venus once held global oceans!",
          },
        },
      },
      partial: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "arai",
            text: "Outer thermal seal breached at 15 km altitude. Mass spectrometer returned noble gas data before telemetry died in the lower supercritical layer.",
          },
        },
      },
      failure: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "hale",
            text: "Thermal runaway in the electronics bay. The probe expired at the upper cloud deck without transmitting core descent telemetry.",
          },
        },
      },
    },
  },

  // ACT III - CHAPTER 9: OCEAN UNDER ICE
  {
    id: "ch-9",
    act: 3,
    order: 9,
    title: "Act III - Chapter 9: Ocean Under Ice",
    subtitle: "Jovian Radiation Belt Infiltration & Cryovolcanic Sounding",
    briefingDate: "August 19, 2044",
    summary: "Navigate the outer solar system to Jupiter, braving lethal radiation belts on 40+ low flybys of Europa to radar-sound its subsurface global ocean.",
    linkedScenarioId: "europa-clipper",
    rewards: {
      xp: 4000,
      reputation: { science: 40, public: 30, treasury: 25 },
    },
    briefing: {
      startNodeId: "node-1",
      nodes: {
        "node-1": {
          type: "say",
          speaker: "okafor",
          text: "Director, we are venturing 600 million kilometers from Earth into the kingdom of Jupiter. Our target: Europa, an ice-covered moon hiding a warm, salty ocean with more water than all of Earth.",
          nextNodeId: "node-2",
        },
        "node-2": {
          type: "say",
          speaker: "arai",
          text: "Jupiter's magnetic field accelerates trapped electrons to near-light speed. Your spacecraft will absorb over 300 krads of radiation. Every processor must sit inside a 9-millimeter titanium vault. At 5.2 AU, solar flux is a measly 50 W/m².",
          nextNodeId: "node-3",
        },
        "node-3": {
          type: "say",
          speaker: "ferreira",
          text: "Our ice-penetrating radar will sound the crust to detect active cryovolcanic plumes. If there is hydrothermal venting on the ocean floor beneath that ice, we are looking at the cradle of alien life.",
          nextNodeId: "node-4",
        },
        "node-4": {
          type: "choice",
          prompt: "Select flyby orbital trajectory:",
          options: [
            {
              label: "Aggressive low-altitude pass (25 km above ice shell) for maximum radar depth.",
              description: "Increases radiation exposure but resolves ice thickness to meter precision.",
              effects: { rep: { science: 8, public: 3, treasury: -4 } },
              nextNodeId: "node-aggressive",
            },
            {
              label: "Conservative standoff orbit (100 km) to preserve avionics lifespan.",
              description: "Maintains radiation shielding margins across decades of extended flight.",
              effects: { rep: { treasury: 5, science: -2 } },
              nextNodeId: "node-standoff",
            },
          ],
        },
        "node-aggressive": {
          type: "say",
          speaker: "ferreira",
          text: "Scientific courage at its finest! We will taste the water plumes directly.",
        },
        "node-standoff": {
          type: "say",
          speaker: "arai",
          text: "Prudent engineering. We ensure multi-year survival across dozens of passes.",
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
            text: "BREAKTHROUGH CONFIRMED! Radar sounders penetrated 15 km of ice into a liquid, salty ocean! Spectrometers detected organic molecules and sodium chloride in erupting plumes! We have answered humanity's oldest question: we are not alone in having water!",
          },
        },
      },
      partial: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "okafor",
            text: "Flyby completed and ocean thickness mapped, but cumulative radiation corrupted the secondary optical camera bench.",
          },
        },
      },
      failure: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "arai",
            text: "Trapped electron surge breached the titanium vault. Flight computers tripped into safe mode during closest approach.",
          },
        },
      },
    },
  },

  // ACT III - CHAPTER 10: BEYOND THE HORIZON
  {
    id: "ch-10",
    act: 3,
    order: 10,
    title: "Act III - Chapter 10: Beyond the Horizon",
    subtitle: "Dragonfly Hydrocarbon Seas Exploration",
    briefingDate: "July 4, 2045",
    summary: "The grand finale of the Meridian Program. Enter Titan's dense, frozen atmosphere 1.4 billion kilometers away, deploying a nuclear MMRTG-powered robotic explorer across prebiotic methane dunes and seas.",
    linkedScenarioId: "titan-explorer",
    rewards: {
      xp: 5000,
      reputation: { science: 50, public: 50, treasury: 50 },
    },
    briefing: {
      startNodeId: "node-1",
      nodes: {
        "node-1": {
          type: "say",
          speaker: "okafor",
          text: "This is the farthest humanity has ever sent an active surface mission, Director: Saturn's giant moon Titan. 1.4 billion kilometers from Earth. At this distance, radio signals take 80 minutes each way. Your spacecraft must fly, think, and survive completely on its own.",
          nextNodeId: "node-2",
        },
        "node-2": {
          type: "say",
          speaker: "arai",
          text: "Titan is colder than liquid nitrogen at 94 Kelvin, and solar flux is virtually zero. Solar panels are dead weight; your only option is the Plutonium-238 MMRTG. The good news: Titan's air is four times denser than Earth's, and gravity is one-seventh. Your lander can soar across entire continents.",
          nextNodeId: "node-3",
        },
        "node-3": {
          type: "say",
          speaker: "hale",
          text: "The entire globe is tuned in. If Meridian completes this mission, the Authority will receive a permanent sovereign charter for humanity's expansion into the cosmos. Bring us into the history books.",
          nextNodeId: "node-4",
        },
        "node-4": {
          type: "choice",
          prompt: "Choose the landing site doctrine on Titan:",
          options: [
            {
              label: "Touch down in the Shangri-La sand seas to analyze complex organic polymers.",
              description: "Direct sampling of prebiotic tholins and hydrocarbon dunes.",
              effects: { rep: { science: 10, treasury: -5 } },
              nextNodeId: "node-shangrila",
            },
            {
              label: "Touch down near the shoreline of Kraken Mare to sample liquid methane hydrologies.",
              description: "Dramatic lake-shore exploration maximizing public wonder and global broadcast.",
              effects: { rep: { public: 10, science: 5 } },
              nextNodeId: "node-kraken",
            },
          ],
        },
        "node-shangrila": {
          type: "say",
          speaker: "ferreira",
          text: "Organic dunes confirmed. We will investigate the molecular precursors to RNA.",
        },
        "node-kraken": {
          type: "say",
          speaker: "okafor",
          text: "The hydrocarbon shores of Titan stand before us. Commence atmospheric entry.",
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
            text: "TRANSMISSION RECEIVED FROM SATURN: MERIDIAN HAS LANDED ON TITAN! The MMRTG hums steadily at -179°C! Atmospheric sounders stream pristine telemetry of liquid methane rains and organic dunes! You have completed the grand trilogy of exploration. The stars are now humanity's backyard.\n\n[CAMPAIGN FINALE COMPLETED]: View your final agency debrief, unlocked ending, and lifetime flight records!",
          },
        },
      },
      partial: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "arai",
            text: "Lander safely touched down and MMRTG power nominal, but high atmospheric cryogenic chill forced the secondary communications relay to operate at reduced duty cycle.",
          },
        },
      },
      failure: {
        startNodeId: "ep-1",
        nodes: {
          "ep-1": {
            type: "say",
            speaker: "hale",
            text: "Autonomous navigation software lost attitude reference in the thick organic haze during the supersonic transition. Telemetry dropped at 30 km altitude.",
          },
        },
      },
    },
  },
];
