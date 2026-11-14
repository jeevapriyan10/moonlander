/**
 * Unit conversion utilities and branded types for astrodynamics calculations.
 */

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function kmToM(km: number): number {
  return km * 1000;
}

export function mToKm(m: number): number {
  return m / 1000;
}

export function secondsToMinutes(sec: number): number {
  return sec / 60;
}

export function minutesToSeconds(min: number): number {
  return min * 60;
}

export function secondsToHours(sec: number): number {
  return sec / 3600;
}

export function hoursToSeconds(hr: number): number {
  return hr * 3600;
}

export function secondsToDays(sec: number): number {
  return sec / 86400;
}

export function daysToSeconds(days: number): number {
  return days * 86400;
}

export function yearsToSeconds(years: number): number {
  return years * 365.25 * 86400;
}

export function secondsToYears(sec: number): number {
  return sec / (365.25 * 86400);
}

export function mbpsToGigabytesPerDay(rateMbps: number, dutyCycle = 1.0): number {
  // (rateMbps * 1e6 bits/sec * 86400 sec/day * dutyCycle) / (8 bits/byte * 1e9 bytes/GB)
  // simplifies to (rateMbps * dutyCycle * 86400) / 8000
  return (rateMbps * dutyCycle * 86400) / 8000;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
