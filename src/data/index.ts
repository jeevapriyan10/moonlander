/**
 * Central Data Loader and Zod Schema Validator.
 * Loads and validates all JSON catalogs at runtime.
 */

import { z } from "zod";
import {
  BusClassDataSchema,
  SolarArrayDataSchema,
  BatteryDataSchema,
  PropulsionDataSchema,
  FlightComputerDataSchema,
  AdcsDataSchema,
  ThermalDataSchema,
  CommsDataSchema,
  StorageDataSchema,
  InstrumentDataSchema,
  LauncherDataSchema,
  OrbitDataSchema,
  GroundNetworkDataSchema,
  ScenarioDataSchema,
  GlossaryTermSchema,
} from "./schemas";

import busesRaw from "./buses.json";
import componentsRaw from "./components.json";
import instrumentsRaw from "./instruments.json";
import launchersRaw from "./launchers.json";
import orbitsRaw from "./orbits.json";
import groundNetworksRaw from "./groundNetworks.json";
import scenariosRaw from "./scenarios.json";
import glossaryRaw from "./glossary.json";

import type { CatalogLookup } from "../engine/evaluate";

// Validate all catalogs with Zod
export const buses = z.array(BusClassDataSchema).parse(busesRaw);
export const solarArrays = z.array(SolarArrayDataSchema).parse(componentsRaw.solarArrays);
export const batteries = z.array(BatteryDataSchema).parse(componentsRaw.batteries);
export const propulsions = z.array(PropulsionDataSchema).parse(componentsRaw.propulsions);
export const flightComputers = z.array(FlightComputerDataSchema).parse(componentsRaw.flightComputers);
export const adcsSystems = z.array(AdcsDataSchema).parse(componentsRaw.adcsSystems);
export const thermals = z.array(ThermalDataSchema).parse(componentsRaw.thermals);
export const commsSystems = z.array(CommsDataSchema).parse(componentsRaw.commsSystems);
export const storages = z.array(StorageDataSchema).parse(componentsRaw.storages);
export const instruments = z.array(InstrumentDataSchema).parse(instrumentsRaw);
export const launchers = z.array(LauncherDataSchema).parse(launchersRaw);
export const orbits = z.array(OrbitDataSchema).parse(orbitsRaw);
export const groundNetworks = z.array(GroundNetworkDataSchema).parse(groundNetworksRaw);
export const scenarios = z.array(ScenarioDataSchema).parse(scenariosRaw);
export const glossary = z.array(GlossaryTermSchema).parse(glossaryRaw);

// Export types derived from validated schemas
export type BusClass = z.infer<typeof BusClassDataSchema>;
export type SolarArray = z.infer<typeof SolarArrayDataSchema>;
export type Battery = z.infer<typeof BatteryDataSchema>;
export type Propulsion = z.infer<typeof PropulsionDataSchema>;
export type FlightComputer = z.infer<typeof FlightComputerDataSchema>;
export type Adcs = z.infer<typeof AdcsDataSchema>;
export type Thermal = z.infer<typeof ThermalDataSchema>;
export type Comms = z.infer<typeof CommsDataSchema>;
export type Storage = z.infer<typeof StorageDataSchema>;
export type Instrument = z.infer<typeof InstrumentDataSchema>;
export type Launcher = z.infer<typeof LauncherDataSchema>;
export type Orbit = z.infer<typeof OrbitDataSchema>;
export type GroundNetwork = z.infer<typeof GroundNetworkDataSchema>;
export type Scenario = z.infer<typeof ScenarioDataSchema>;
export type GlossaryTerm = z.infer<typeof GlossaryTermSchema>;

// Build typed catalog lookup object for pure evaluation engine
export function getCatalogLookup(): CatalogLookup {
  const catalog: CatalogLookup = {
    buses: {},
    orbits: {},
    launchers: {},
    solarArrays: {},
    batteries: {},
    propulsions: {},
    adcsSystems: {},
    flightComputers: {},
    thermals: {},
    commsSystems: {},
    groundNetworks: {},
    instruments: {},
    scenarios: {},
  };

  for (const b of buses) catalog.buses[b.id] = b;
  for (const o of orbits) catalog.orbits[o.id] = o;
  for (const l of launchers) catalog.launchers[l.id] = l;
  for (const sa of solarArrays) catalog.solarArrays[sa.id] = sa;
  for (const bt of batteries) catalog.batteries[bt.id] = bt;
  for (const pr of propulsions) catalog.propulsions[pr.id] = pr;
  for (const ad of adcsSystems) catalog.adcsSystems[ad.id] = ad;
  for (const fc of flightComputers) catalog.flightComputers[fc.id] = fc;
  for (const th of thermals) catalog.thermals[th.id] = th;
  for (const cm of commsSystems) catalog.commsSystems[cm.id] = cm;
  for (const gn of groundNetworks) catalog.groundNetworks[gn.id] = gn;
  for (const inst of instruments) catalog.instruments[inst.id] = inst;
  for (const sc of scenarios) catalog.scenarios[sc.id] = sc;

  return catalog;
}

const LEVEL_RANK = {
  YOUTH: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
};

export function isItemAvailableForDifficulty(
  itemMinLevel: "YOUTH" | "INTERMEDIATE" | "ADVANCED",
  selectedDifficulty: "YOUTH" | "INTERMEDIATE" | "ADVANCED"
): boolean {
  return LEVEL_RANK[itemMinLevel] <= LEVEL_RANK[selectedDifficulty];
}
