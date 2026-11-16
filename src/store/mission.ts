import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeStateStorage, STORAGE_KEYS } from "@/lib/storage";
import {
  evaluateMission,
  type MissionDesignConfig,
  type MissionEvaluation,
} from "../engine/evaluate";
import { generateSeedCode } from "../engine/rng";
import { getCatalogLookup } from "../data";
import type { SimulationResult } from "../engine/ops/types";

export type DifficultyLevel = "YOUTH" | "INTERMEDIATE" | "ADVANCED";

export interface MissionStoreState {
  currentMission: MissionDesignConfig;
  savedMissions: Record<string, MissionDesignConfig>;
  evaluation: MissionEvaluation;
  opsResult: SimulationResult | null;

  // Actions
  updateDesign: (patch: Partial<MissionDesignConfig>) => void;
  applyFix: (patch: Record<string, unknown>) => void;
  setDifficulty: (difficulty: DifficultyLevel) => void;
  setOpsResult: (result: SimulationResult | null) => void;
  createMission: (
    scenarioId: string,
    difficulty: DifficultyLevel,
    isSandbox?: boolean
  ) => string;
  initMission: (
    scenarioId: string,
    difficulty?: DifficultyLevel,
    isSandbox?: boolean
  ) => string;
  loadMission: (id: string) => void;
  saveCurrentMission: () => void;
  deleteMission: (id: string) => void;
  exportMissionJson: () => string;
  importMissionJson: (jsonStr: string) => boolean;
  exportShareCode: () => string;
  importShareCode: (code: string) => boolean;
  recalculate: () => void;
}

const catalog = getCatalogLookup();

export function getDefaultMissionConfig(
  scenarioId = "earth-watch",
  difficulty: "YOUTH" | "INTERMEDIATE" | "ADVANCED" = "YOUTH",
  isSandbox = false
): MissionDesignConfig {
  const seed = generateSeedCode();
  const id = `mission-${Date.now()}-${seed.toLowerCase()}`;

  if (scenarioId === "earth-watch") {
    return {
      id,
      seed,
      name: "Wildfire Sentinel-1",
      scenarioId: "earth-watch",
      difficulty,
      isSandbox,
      busId: "bus-midsize",
      orbitId: "sso-700",
      launcherId: "vega-c",
      solarArrayId: "solar-gaas-triple",
      solarArrayAreaM2: 7.5,
      batteryId: "battery-li-ion-std",
      batteryCapacityWh: 1200,
      propulsionId: "prop-biprop",
      propellantMassKg: 120,
      adcsId: "adcs-fine-pointing",
      flightComputerId: "fc-rad-tolerant",
      thermalId: "thermal-passive",
      commsId: "comms-ka-band",
      groundNetworkId: "net-commercial-global",
      storageGb: 512,
      selectedInstrumentIds: ["inst-multispectral"],
    };
  }

  if (scenarioId === "exoplanet-hunter") {
    return {
      id,
      seed,
      name: "Stellar Transit Surveyor",
      scenarioId: "exoplanet-hunter",
      difficulty,
      isSandbox,
      busId: "bus-smallsat",
      orbitId: "heo-tess",
      launcherId: "falcon-9",
      solarArrayId: "solar-gaas-triple",
      solarArrayAreaM2: 3.5,
      batteryId: "battery-li-ion-std",
      batteryCapacityWh: 450,
      propulsionId: "prop-biprop",
      propellantMassKg: 70,
      adcsId: "adcs-fine-pointing",
      flightComputerId: "fc-rad-tolerant",
      thermalId: "thermal-passive",
      commsId: "comms-x-band",
      groundNetworkId: "net-dsn-nsn",
      storageGb: 512,
      selectedInstrumentIds: ["inst-transit-photometer"],
    };
  }

  if (scenarioId === "space-weather-sentinel") {
    return {
      id,
      seed,
      name: "Solar Storm Sentinel",
      scenarioId: "space-weather-sentinel",
      difficulty,
      isSandbox,
      busId: "bus-midsize",
      orbitId: "l1-halo",
      launcherId: "falcon-9",
      solarArrayId: "solar-gaas-triple",
      solarArrayAreaM2: 5.0,
      batteryId: "battery-li-ion-std",
      batteryCapacityWh: 900,
      propulsionId: "prop-biprop",
      propellantMassKg: 110,
      adcsId: "adcs-fine-pointing",
      flightComputerId: "fc-rad-hard",
      thermalId: "thermal-passive",
      commsId: "comms-x-band",
      groundNetworkId: "net-dsn-nsn",
      storageGb: 512,
      selectedInstrumentIds: ["inst-hyperspectral"],
    };
  }

  if (scenarioId === "deep-space-telescope") {
    return {
      id,
      seed,
      name: "Cosmic Dawn Explorer",
      scenarioId: "deep-space-telescope",
      difficulty,
      isSandbox,
      busId: "bus-flagship",
      orbitId: "l2-halo",
      launcherId: "falcon-heavy",
      solarArrayId: "solar-gaas-triple",
      solarArrayAreaM2: 9.0,
      batteryId: "battery-li-ion-adv",
      batteryCapacityWh: 4500,
      propulsionId: "prop-biprop",
      propellantMassKg: 180,
      adcsId: "adcs-fine-pointing",
      flightComputerId: "fc-rad-hard",
      thermalId: "thermal-cryocooler",
      commsId: "comms-ka-band",
      groundNetworkId: "net-dsn-nsn",
      storageGb: 1024,
      selectedInstrumentIds: ["inst-stellar-spectrograph", "inst-coronagraph"],
    };
  }

  if (scenarioId === "geo-telecom-relay") {
    return {
      id,
      seed,
      name: "Equatorial Comms Relay",
      scenarioId: "geo-telecom-relay",
      difficulty,
      isSandbox,
      busId: "bus-midsize",
      orbitId: "geo-35786",
      launcherId: "falcon-9",
      solarArrayId: "solar-gaas-triple",
      solarArrayAreaM2: 12.0,
      batteryId: "battery-li-ion-adv",
      batteryCapacityWh: 2400,
      propulsionId: "prop-biprop",
      propellantMassKg: 280,
      adcsId: "adcs-fine-pointing",
      flightComputerId: "fc-rad-hard",
      thermalId: "thermal-heat-pipes",
      commsId: "comms-ka-band",
      groundNetworkId: "net-dedicated-single",
      storageGb: 1024,
      selectedInstrumentIds: ["inst-sar-radar"],
    };
  }

  if (scenarioId === "lunar-pathfinder") {
    return {
      id,
      seed,
      name: "Lunar Recon Pathfinder",
      scenarioId: "lunar-pathfinder",
      difficulty,
      isSandbox,
      busId: "bus-midsize",
      orbitId: "llo-100",
      launcherId: "falcon-9",
      solarArrayId: "solar-gaas-triple",
      solarArrayAreaM2: 6.0,
      batteryId: "battery-li-ion-std",
      batteryCapacityWh: 1100,
      propulsionId: "prop-biprop",
      propellantMassKg: 160,
      adcsId: "adcs-fine-pointing",
      flightComputerId: "fc-rad-tolerant",
      thermalId: "thermal-heat-pipes",
      commsId: "comms-x-band",
      groundNetworkId: "net-dsn-nsn",
      storageGb: 512,
      selectedInstrumentIds: ["inst-highres-pan"],
    };
  }

  if (scenarioId === "lunar-south-pole") {
    return {
      id,
      seed,
      name: "Shackleton Polar Lander",
      scenarioId: "lunar-south-pole",
      difficulty,
      isSandbox,
      busId: "bus-lander",
      orbitId: "lunar-surface",
      launcherId: "falcon-heavy",
      solarArrayId: "solar-gaas-triple",
      solarArrayAreaM2: 5.5,
      batteryId: "battery-li-ion-adv",
      batteryCapacityWh: 1400,
      propulsionId: "prop-descent-throttleable",
      propellantMassKg: 500,
      adcsId: "adcs-rcs-pulse",
      flightComputerId: "fc-rad-hard",
      thermalId: "thermal-heat-pipes",
      commsId: "comms-x-band",
      groundNetworkId: "net-dsn-nsn",
      storageGb: 512,
      selectedInstrumentIds: ["inst-landing-lidar", "inst-surface-spectrometer"],
    };
  }

  if (scenarioId === "red-planet-relay") {
    return {
      id,
      seed,
      name: "Ares Orbital Relay",
      scenarioId: "red-planet-relay",
      difficulty,
      isSandbox,
      busId: "bus-flagship",
      orbitId: "lmo-400",
      launcherId: "falcon-heavy",
      solarArrayId: "solar-gaas-triple",
      solarArrayAreaM2: 15.0,
      batteryId: "battery-li-ion-adv",
      batteryCapacityWh: 2200,
      propulsionId: "prop-biprop",
      propellantMassKg: 300,
      adcsId: "adcs-fine-pointing",
      flightComputerId: "fc-rad-hard",
      thermalId: "thermal-heat-pipes",
      commsId: "comms-ka-band",
      groundNetworkId: "net-dsn-nsn",
      storageGb: 1024,
      selectedInstrumentIds: ["inst-highres-pan", "inst-hyperspectral"],
    };
  }

  if (scenarioId === "mars-landing") {
    return {
      id,
      seed,
      name: "Perseverance Twin // Jezero Lander",
      scenarioId: "mars-landing",
      difficulty,
      isSandbox,
      busId: "bus-lander",
      orbitId: "mars-surface",
      launcherId: "falcon-heavy",
      solarArrayId: "solar-gaas-triple",
      solarArrayAreaM2: 8.0,
      batteryId: "battery-li-ion-adv",
      batteryCapacityWh: 1800,
      propulsionId: "prop-mars-retro",
      propellantMassKg: 650,
      adcsId: "adcs-rcs-pulse",
      flightComputerId: "fc-rad-hard",
      thermalId: "thermal-heat-pipes",
      commsId: "comms-dsn-hga",
      groundNetworkId: "net-dsn-nsn",
      storageGb: 1024,
      selectedInstrumentIds: ["inst-landing-lidar", "inst-surface-spectrometer"],
    };
  }

  if (scenarioId === "venus-probe") {
    return {
      id,
      seed,
      name: "Aphrodite Atmospheric Descent Probe",
      scenarioId: "venus-probe",
      difficulty,
      isSandbox,
      busId: "bus-midsize",
      orbitId: "venus-atmosphere",
      launcherId: "falcon-heavy",
      solarArrayId: "solar-gaas-triple",
      solarArrayAreaM2: 5.0,
      batteryId: "battery-li-ion-adv",
      batteryCapacityWh: 2000,
      propulsionId: "prop-biprop",
      propellantMassKg: 400,
      adcsId: "adcs-fine-pointing",
      flightComputerId: "fc-rad-hard",
      thermalId: "thermal-heat-pipes",
      commsId: "comms-dsn-hga",
      groundNetworkId: "net-dsn-nsn",
      storageGb: 512,
      selectedInstrumentIds: ["inst-sar-radar", "inst-hyperspectral"],
    };
  }

  if (scenarioId === "europa-clipper") {
    return {
      id,
      seed,
      name: "Jovian Subsurface Ocean Surveyor",
      scenarioId: "europa-clipper",
      difficulty,
      isSandbox,
      busId: "bus-flagship",
      orbitId: "europa-flyby",
      launcherId: "falcon-heavy",
      solarArrayId: "solar-rtg-nuclear",
      solarArrayAreaM2: 2.5,
      batteryId: "battery-li-ion-adv",
      batteryCapacityWh: 3000,
      propulsionId: "prop-biprop",
      propellantMassKg: 850,
      adcsId: "adcs-fine-pointing",
      flightComputerId: "fc-rad-hard",
      thermalId: "thermal-heat-pipes",
      commsId: "comms-dsn-hga",
      groundNetworkId: "net-dsn-nsn",
      storageGb: 2048,
      selectedInstrumentIds: ["inst-sar-radar", "inst-hyperspectral"],
    };
  }

  if (scenarioId === "titan-explorer") {
    return {
      id,
      seed,
      name: "Dragonfly Titan Prebiotic Drone",
      scenarioId: "titan-explorer",
      difficulty,
      isSandbox,
      busId: "bus-lander",
      orbitId: "titan-atmosphere",
      launcherId: "falcon-heavy",
      solarArrayId: "solar-rtg-nuclear",
      solarArrayAreaM2: 2.0,
      batteryId: "battery-li-ion-adv",
      batteryCapacityWh: 2500,
      propulsionId: "prop-descent-throttleable",
      propellantMassKg: 750,
      adcsId: "adcs-rcs-pulse",
      flightComputerId: "fc-rad-hard",
      thermalId: "thermal-heat-pipes",
      commsId: "comms-dsn-hga",
      groundNetworkId: "net-dsn-nsn",
      storageGb: 1024,
      selectedInstrumentIds: ["inst-surface-spectrometer", "inst-landing-lidar"],
    };
  }

  if (scenarioId === "asteroid-sample-return") {
    return {
      id,
      seed,
      name: "Bennu Primitive Regolith Retriever",
      scenarioId: "asteroid-sample-return",
      difficulty,
      isSandbox,
      busId: "bus-midsize",
      orbitId: "asteroid-rendezvous",
      launcherId: "falcon-heavy",
      solarArrayId: "solar-gaas-triple",
      solarArrayAreaM2: 8.0,
      batteryId: "battery-li-ion-adv",
      batteryCapacityWh: 1500,
      propulsionId: "prop-biprop",
      propellantMassKg: 450,
      adcsId: "adcs-fine-pointing",
      flightComputerId: "fc-rad-hard",
      thermalId: "thermal-passive",
      commsId: "comms-dsn-hga",
      groundNetworkId: "net-dsn-nsn",
      storageGb: 512,
      selectedInstrumentIds: ["inst-landing-lidar", "inst-hyperspectral"],
    };
  }

  // Generic fallback default
  return {
    id,
    seed,
    name: "Orbital Explorer",
    scenarioId,
    difficulty,
    isSandbox,
    busId: "bus-microsat",
    orbitId: "leo-500",
    launcherId: "electron",
    solarArrayId: "solar-silicon",
    solarArrayAreaM2: 2.0,
    batteryId: "battery-li-ion-std",
    batteryCapacityWh: 250,
    propulsionId: "prop-cold-gas",
    propellantMassKg: 15,
    adcsId: "adcs-reaction-wheels",
    flightComputerId: "fc-cots",
    thermalId: "thermal-passive",
    commsId: "comms-s-band",
    groundNetworkId: "net-dedicated-single",
    storageGb: 128,
    selectedInstrumentIds: ["inst-hyperspectral"],
  };
}

export { getDefaultMissionConfig as createDefaultDesign };

const initialConfig = getDefaultMissionConfig();
const initialEval = evaluateMission(initialConfig, catalog);

function sanitizePatch(patch: Partial<MissionDesignConfig>): Partial<MissionDesignConfig> {
  const sanitized = { ...patch };
  if (sanitized.solarArrayAreaM2 !== undefined) {
    sanitized.solarArrayAreaM2 = Number.isFinite(sanitized.solarArrayAreaM2)
      ? Math.max(0.1, Math.min(200, sanitized.solarArrayAreaM2))
      : 2.0;
  }
  if (sanitized.batteryCapacityWh !== undefined) {
    sanitized.batteryCapacityWh = Number.isFinite(sanitized.batteryCapacityWh)
      ? Math.max(10, Math.min(50000, sanitized.batteryCapacityWh))
      : 250;
  }
  if (sanitized.propellantMassKg !== undefined) {
    sanitized.propellantMassKg = Number.isFinite(sanitized.propellantMassKg)
      ? Math.max(0, Math.min(20000, sanitized.propellantMassKg))
      : 15;
  }
  if (sanitized.storageGb !== undefined) {
    sanitized.storageGb = Number.isFinite(sanitized.storageGb)
      ? Math.max(1, Math.min(100000, sanitized.storageGb))
      : 128;
  }
  return sanitized;
}

export const useMissionStore = create<MissionStoreState>()(
  persist(
    (set, get) => ({
      currentMission: initialConfig,
      savedMissions: {
        [initialConfig.id]: initialConfig,
      },
      evaluation: initialEval,
      opsResult: null,

      setOpsResult: (result) => set({ opsResult: result }),

      recalculate: () => {
        const { currentMission } = get();
        const evalResult = evaluateMission(currentMission, catalog);
        set({ evaluation: evalResult });
      },

      updateDesign: (patch) => {
        const { currentMission, savedMissions } = get();
        const cleanPatch = sanitizePatch(patch);
        const updated = { ...currentMission, ...cleanPatch };
        const evalResult = evaluateMission(updated, catalog);
        set({
          currentMission: updated,
          savedMissions: {
            ...savedMissions,
            [updated.id]: updated,
          },
          evaluation: evalResult,
        });
      },

      applyFix: (patch) => {
        const { currentMission, savedMissions } = get();
        const cleanPatch = sanitizePatch(patch);
        const updated = { ...currentMission, ...cleanPatch };
        const evalResult = evaluateMission(updated, catalog);
        set({
          currentMission: updated,
          savedMissions: {
            ...savedMissions,
            [updated.id]: updated,
          },
          evaluation: evalResult,
        });
      },

      setDifficulty: (difficulty) => {
        get().updateDesign({ difficulty });
      },

      createMission: (scenarioId, difficulty, isSandbox = false) => {
        const config = getDefaultMissionConfig(scenarioId, difficulty, isSandbox);
        const evalResult = evaluateMission(config, catalog);
        const { savedMissions } = get();
        set({
          currentMission: config,
          savedMissions: {
            ...savedMissions,
            [config.id]: config,
          },
          evaluation: evalResult,
        });
        return config.id;
      },

      initMission: (scenarioId, difficulty = "INTERMEDIATE", isSandbox = false) => {
        return get().createMission(scenarioId, difficulty, isSandbox);
      },

      loadMission: (id) => {
        const { savedMissions } = get();
        const target = savedMissions[id];
        if (target) {
          const evalResult = evaluateMission(target, catalog);
          set({
            currentMission: target,
            evaluation: evalResult,
          });
        }
      },

      saveCurrentMission: () => {
        const { currentMission, savedMissions } = get();
        set({
          savedMissions: {
            ...savedMissions,
            [currentMission.id]: currentMission,
          },
        });
      },

      deleteMission: (id) => {
        const { savedMissions, currentMission } = get();
        const updated = { ...savedMissions };
        delete updated[id];
        const remaining = Object.values(updated);
        const fallback = remaining[0] ?? getDefaultMissionConfig();
        const evalResult = evaluateMission(fallback, catalog);
        set({
          savedMissions: updated,
          currentMission: currentMission.id === id ? fallback : currentMission,
          evaluation: currentMission.id === id ? evalResult : get().evaluation,
        });
      },

      exportMissionJson: () => {
        const { currentMission } = get();
        return JSON.stringify(currentMission, null, 2);
      },

      importMissionJson: (jsonStr) => {
        try {
          const parsed = JSON.parse(jsonStr) as MissionDesignConfig;
          if (!parsed.id || !parsed.scenarioId || !parsed.busId) {
            return false;
          }
          const { savedMissions } = get();
          const evalResult = evaluateMission(parsed, catalog);
          set({
            currentMission: parsed,
            savedMissions: {
              ...savedMissions,
              [parsed.id]: parsed,
            },
            evaluation: evalResult,
          });
          return true;
        } catch {
          return false;
        }
      },

      exportShareCode: () => {
        const { currentMission } = get();
        try {
          const jsonStr = JSON.stringify(currentMission);
          const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
          return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        } catch {
          return "";
        }
      },

      importShareCode: (code) => {
        try {
          let base64 = code.replace(/-/g, "+").replace(/_/g, "/");
          while (base64.length % 4) {
            base64 += "=";
          }
          const jsonStr = decodeURIComponent(escape(atob(base64)));
          return get().importMissionJson(jsonStr);
        } catch {
          return false;
        }
      },
    }),
    {
      name: STORAGE_KEYS.MISSION,
      version: 2,
      storage: createJSONStorage(() => safeStateStorage),
      skipHydration: true,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 1 && persistedState && typeof persistedState === "object") {
          return persistedState as MissionStoreState;
        }
        return persistedState as MissionStoreState;
      },
    }
  )
);

