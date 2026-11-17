/**
 * MoonLander Host-Authoritative Operation Log & Rebase Engine
 * 
 * Implements strict role-permission checking, deterministic patch application,
 * conflict detection, and client rebasing.
 */

import type { MissionDesignConfig } from "../evaluate";
import { FIELD_ROLE_OWNERSHIP, type CrewOp, type CrewRole } from "./types";

/**
 * Validates whether a specific role is authorized to mutate a given design property.
 * When in Solo mode, any role can edit any field.
 */
export function canRoleEditField(
  role: CrewRole,
  field: keyof MissionDesignConfig,
  isSolo = false
): boolean {
  if (isSolo) return true;
  return FIELD_ROLE_OWNERSHIP[field] === role;
}

/**
 * Filters a patch object so that only fields owned by the role are retained.
 */
export function filterPatchForRole(
  role: CrewRole,
  patch: Partial<MissionDesignConfig>,
  isSolo = false
): {
  authorizedPatch: Partial<MissionDesignConfig>;
  rejectedFields: (keyof MissionDesignConfig)[];
} {
  const authorizedPatch: Partial<MissionDesignConfig> = {};
  const rejectedFields: (keyof MissionDesignConfig)[] = [];

  for (const key of Object.keys(patch) as (keyof MissionDesignConfig)[]) {
    if (canRoleEditField(role, key, isSolo)) {
      (authorizedPatch as any)[key] = patch[key];
    } else {
      rejectedFields.push(key);
    }
  }

  return { authorizedPatch, rejectedFields };
}

export interface ApplyOpResult {
  success: boolean;
  newConfig: MissionDesignConfig;
  newVersion: number;
  reason?: string;
  rebased?: boolean;
}

/**
 * Pure function to apply a proposed operation to the host's authoritative mission state.
 * If the client submitted an op with baseVersion < currentVersion, checks whether the patch
 * collides with any intermediate operations. If no collision, rebases cleanly.
 */
export function applyOpToAuthoritativeState(
  currentConfig: MissionDesignConfig,
  currentVersion: number,
  opHistory: CrewOp[],
  proposedOp: CrewOp,
  isSolo = false
): ApplyOpResult {
  // 1. Permission Check
  const { authorizedPatch, rejectedFields } = filterPatchForRole(
    proposedOp.role,
    proposedOp.patch,
    isSolo
  );

  if (Object.keys(authorizedPatch).length === 0 && rejectedFields.length > 0) {
    return {
      success: false,
      newConfig: currentConfig,
      newVersion: currentVersion,
      reason: `Permission denied: Role ${proposedOp.role} is not authorized to edit [${rejectedFields.join(", ")}]`,
    };
  }

  // 2. Strict Version Check
  if (proposedOp.baseVersion === currentVersion) {
    const updated: MissionDesignConfig = {
      ...currentConfig,
      ...authorizedPatch,
    };
    return {
      success: true,
      newConfig: updated,
      newVersion: currentVersion + 1,
      rebased: false,
    };
  }

  // 3. Stale Op Handling: Rebase check
  if (proposedOp.baseVersion < currentVersion) {
    // Collect all fields modified between proposedOp.baseVersion and currentVersion
    const conflictingOps = opHistory.slice(proposedOp.baseVersion);
    const modifiedFields = new Set<keyof MissionDesignConfig>();

    for (const pastOp of conflictingOps) {
      for (const key of Object.keys(pastOp.patch) as (keyof MissionDesignConfig)[]) {
        modifiedFields.add(key);
      }
    }

    // Check for collisions
    const collisions = (Object.keys(authorizedPatch) as (keyof MissionDesignConfig)[]).filter(
      (k) => modifiedFields.has(k)
    );

    if (collisions.length > 0) {
      return {
        success: false,
        newConfig: currentConfig,
        newVersion: currentVersion,
        reason: `Concurrent conflict: Fields [${collisions.join(", ")}] were modified by another officer. Rebase required.`,
      };
    }

    // Safe rebase: no conflicting fields were touched
    const rebasedConfig: MissionDesignConfig = {
      ...currentConfig,
      ...authorizedPatch,
    };

    return {
      success: true,
      newConfig: rebasedConfig,
      newVersion: currentVersion + 1,
      rebased: true,
    };
  }

  // Future baseVersion is invalid
  return {
    success: false,
    newConfig: currentConfig,
    newVersion: currentVersion,
    reason: `Invalid baseVersion ${proposedOp.baseVersion} > currentVersion ${currentVersion}`,
  };
}

/**
 * Replays an entire operation log on top of an initial design.
 * Guarantees convergence across all peers.
 */
export function replayOpLog(
  initialConfig: MissionDesignConfig,
  opLog: CrewOp[]
): {
  finalConfig: MissionDesignConfig;
  appliedCount: number;
} {
  let config = { ...initialConfig };
  let appliedCount = 0;

  // Sort deterministically by resultingVersion or timestamp
  const sorted = [...opLog].sort((a, b) => a.resultingVersion - b.resultingVersion);

  for (const op of sorted) {
    config = {
      ...config,
      ...op.patch,
    };
    appliedCount++;
  }

  return { finalConfig: config, appliedCount };
}
