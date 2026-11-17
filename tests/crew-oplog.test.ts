import { describe, it, expect } from "vitest";
import {
  canRoleEditField,
  filterPatchForRole,
  applyOpToAuthoritativeState,
  replayOpLog,
  type CrewOp,
  type CrewRole,
} from "@/engine/crew";
import { getDefaultMissionConfig } from "@/store/mission";
import type { MissionDesignConfig } from "@/engine/evaluate";

describe("Crew Mode: Operation Log & Role Permissions", () => {
  const initialConfig = getDefaultMissionConfig("earth-watch", "INTERMEDIATE", false);

  it("enforces strict role-based design section ownership", () => {
    // Spacecraft Engineer owns busId, batteryCapacityWh, solarArrayId, etc.
    expect(canRoleEditField("SPACECRAFT_ENGINEER", "busId")).toBe(true);
    expect(canRoleEditField("SPACECRAFT_ENGINEER", "solarArrayAreaM2")).toBe(true);
    expect(canRoleEditField("SPACECRAFT_ENGINEER", "batteryCapacityWh")).toBe(true);
    expect(canRoleEditField("SPACECRAFT_ENGINEER", "launcherId")).toBe(false); // Owned by Flight Dynamics
    expect(canRoleEditField("SPACECRAFT_ENGINEER", "commsId")).toBe(false); // Owned by Finance

    // Flight Dynamics owns launcherId, orbitId, propulsionId, propellantMassKg
    expect(canRoleEditField("FLIGHT_DYNAMICS", "launcherId")).toBe(true);
    expect(canRoleEditField("FLIGHT_DYNAMICS", "orbitId")).toBe(true);
    expect(canRoleEditField("FLIGHT_DYNAMICS", "propellantMassKg")).toBe(true);
    expect(canRoleEditField("FLIGHT_DYNAMICS", "busId")).toBe(false);

    // Comms & Finance owns commsId, groundNetworkId, storageGb
    expect(canRoleEditField("COMMS_FINANCE", "commsId")).toBe(true);
    expect(canRoleEditField("COMMS_FINANCE", "groundNetworkId")).toBe(true);
    expect(canRoleEditField("COMMS_FINANCE", "selectedInstrumentIds")).toBe(false);

    // Mission Director owns payload and objectives
    expect(canRoleEditField("MISSION_DIRECTOR", "selectedInstrumentIds")).toBe(true);
    expect(canRoleEditField("MISSION_DIRECTOR", "name")).toBe(true);
    expect(canRoleEditField("MISSION_DIRECTOR", "busId")).toBe(false);
  });

  it("permits any edit when in Solo mode", () => {
    expect(canRoleEditField("SPACECRAFT_ENGINEER", "launcherId", true)).toBe(true);
    expect(canRoleEditField("FLIGHT_DYNAMICS", "busId", true)).toBe(true);
  });

  it("strips unauthorized properties from a patch", () => {
    const attemptedPatch: Partial<MissionDesignConfig> = {
      busId: "bus-flagship", // Engineer field
      launcherId: "falcon-heavy", // Flight Dynamics field
      storageGb: 512, // Finance field
    };

    const { authorizedPatch, rejectedFields } = filterPatchForRole(
      "SPACECRAFT_ENGINEER",
      attemptedPatch
    );

    expect(authorizedPatch.busId).toBe("bus-flagship");
    expect(authorizedPatch.launcherId).toBeUndefined();
    expect(authorizedPatch.storageGb).toBeUndefined();
    expect(rejectedFields).toContain("launcherId");
    expect(rejectedFields).toContain("storageGb");
  });

  it("applies sequential operations cleanly to authoritative state", () => {
    const op1: CrewOp = {
      opId: "op-1",
      role: "SPACECRAFT_ENGINEER",
      clientId: "client-eng",
      clientCallsign: "ChiefEng",
      patch: { batteryCapacityWh: 3000 },
      baseVersion: 0,
      resultingVersion: 1,
      timestamp: 1000,
    };

    const res1 = applyOpToAuthoritativeState(initialConfig, 0, [], op1);
    expect(res1.success).toBe(true);
    expect(res1.newVersion).toBe(1);
    expect(res1.newConfig.batteryCapacityWh).toBe(3000);

    const op2: CrewOp = {
      opId: "op-2",
      role: "FLIGHT_DYNAMICS",
      clientId: "client-fdo",
      clientCallsign: "AstroNav",
      patch: { propellantMassKg: 600 },
      baseVersion: 1,
      resultingVersion: 2,
      timestamp: 2000,
    };

    const res2 = applyOpToAuthoritativeState(res1.newConfig, 1, [op1], op2);
    expect(res2.success).toBe(true);
    expect(res2.newVersion).toBe(2);
    expect(res2.newConfig.batteryCapacityWh).toBe(3000);
    expect(res2.newConfig.propellantMassKg).toBe(600);
  });

  it("rebases non-conflicting concurrent operations from different roles", () => {
    // Op1 from Engineer applied at version 0 -> 1
    const op1: CrewOp = {
      opId: "op-1",
      role: "SPACECRAFT_ENGINEER",
      clientId: "client-eng",
      clientCallsign: "ChiefEng",
      patch: { batteryCapacityWh: 2500 },
      baseVersion: 0,
      resultingVersion: 1,
      timestamp: 1000,
    };

    const res1 = applyOpToAuthoritativeState(initialConfig, 0, [], op1);

    // Op2 from Flight Dynamics was generated concurrently (baseVersion: 0), but submitted when host is at version 1
    const concurrentOp2: CrewOp = {
      opId: "op-2",
      role: "FLIGHT_DYNAMICS",
      clientId: "client-fdo",
      clientCallsign: "AstroNav",
      patch: { propellantMassKg: 450 },
      baseVersion: 0, // Stale!
      resultingVersion: 1,
      timestamp: 1500,
    };

    const res2 = applyOpToAuthoritativeState(res1.newConfig, 1, [op1], concurrentOp2);
    expect(res2.success).toBe(true);
    expect(res2.rebased).toBe(true);
    expect(res2.newVersion).toBe(2);
    expect(res2.newConfig.batteryCapacityWh).toBe(2500); // from op1
    expect(res2.newConfig.propellantMassKg).toBe(450); // from op2
  });

  it("property test: random interleavings of 4 client operations converge to identical state", () => {
    const roles: CrewRole[] = [
      "MISSION_DIRECTOR",
      "SPACECRAFT_ENGINEER",
      "FLIGHT_DYNAMICS",
      "COMMS_FINANCE",
    ];

    const allOps: CrewOp[] = [
      {
        opId: "op-dir-1",
        role: "MISSION_DIRECTOR",
        clientId: "client-dir",
        clientCallsign: "Dir",
        patch: { name: "Collaborative Alpha" },
        baseVersion: 0,
        resultingVersion: 1,
        timestamp: 100,
      },
      {
        opId: "op-eng-1",
        role: "SPACECRAFT_ENGINEER",
        clientId: "client-eng",
        clientCallsign: "Eng",
        patch: { batteryCapacityWh: 1800, solarArrayAreaM2: 8 },
        baseVersion: 1,
        resultingVersion: 2,
        timestamp: 200,
      },
      {
        opId: "op-fdo-1",
        role: "FLIGHT_DYNAMICS",
        clientId: "client-fdo",
        clientCallsign: "FDO",
        patch: { propellantMassKg: 350, launcherId: "falcon-9" },
        baseVersion: 2,
        resultingVersion: 3,
        timestamp: 300,
      },
      {
        opId: "op-com-1",
        role: "COMMS_FINANCE",
        clientId: "client-com",
        clientCallsign: "Comptroller",
        patch: { storageGb: 256, commsId: "comms-x-band" },
        baseVersion: 3,
        resultingVersion: 4,
        timestamp: 400,
      },
    ];

    // Shuffle operations into 5 random orderings
    for (let i = 0; i < 5; i++) {
      const shuffled = [...allOps].sort(() => Math.random() - 0.5);
      const { finalConfig, appliedCount } = replayOpLog(initialConfig, shuffled);

      expect(appliedCount).toBe(4);
      expect(finalConfig.name).toBe("Collaborative Alpha");
      expect(finalConfig.batteryCapacityWh).toBe(1800);
      expect(finalConfig.solarArrayAreaM2).toBe(8);
      expect(finalConfig.propellantMassKg).toBe(350);
      expect(finalConfig.launcherId).toBe("falcon-9");
      expect(finalConfig.storageGb).toBe(256);
      expect(finalConfig.commsId).toBe("comms-x-band");
    }
  });
});
