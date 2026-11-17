/**
 * Callsign Validation and Sanitization Module for MoonLander
 * 
 * Enforces strict aerospace callsign standards:
 * - Length: 3 to 20 characters
 * - Characters: Alphanumeric, hyphens, and underscores only
 * - Offensive term and profanity filtering
 * - Case preservation with trimmed whitespace
 */

const PROFANITY_BLOCKLIST = new Set([
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "cunt",
  "kike",
  "spic",
  "chink",
  "retard",
  "bitch",
  "slut",
  "whore",
  "nazi",
  "hitler",
  "cock",
  "dick",
  "pussy",
  "asshole",
  "bastard",
  "motherfucker",
  "pedophile",
  "pedo",
]);

export interface CallsignValidationResult {
  valid: boolean;
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validates a pilot callsign according to length, character set, and content guidelines.
 */
export function validateCallsign(rawCallsign: string): CallsignValidationResult {
  const trimmed = (rawCallsign || "").trim();

  if (trimmed.length < 3) {
    return {
      valid: false,
      isValid: false,
      error: "Callsign must be at least 3 characters long.",
    };
  }

  if (trimmed.length > 20) {
    return {
      valid: false,
      isValid: false,
      error: "Callsign must not exceed 20 characters.",
    };
  }

  // Allowed: letters, numbers, hyphen, underscore
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      valid: false,
      isValid: false,
      error: "Callsign can only contain letters, numbers, hyphens (-), and underscores (_).",
    };
  }

  // Check for profanity / blocked substrings
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const blocked of PROFANITY_BLOCKLIST) {
    if (normalized.includes(blocked)) {
      return {
        valid: false,
        isValid: false,
        error: "Callsign contains prohibited or restricted language.",
      };
    }
  }

  return {
    valid: true,
    isValid: true,
    sanitized: trimmed,
  };
}
