/**
 * Deterministic hex seed — mirrors the Go agent's hourly seed derivation.
 * Input: "YYYY-MM-DD-HH" string → djb2-style hash → 8-char uppercase hex.
 */
export function deriveHexSeed(dateHourKey: string): string {
  let hash = 5381;
  for (let i = 0; i < dateHourKey.length; i++) {
    // djb2: hash = hash * 33 ^ char
    hash = ((hash << 5) + hash) ^ dateHourKey.charCodeAt(i);
    hash = hash >>> 0; // keep it an unsigned 32-bit integer
  }
  return hash.toString(16).toUpperCase().padStart(8, "0");
}

/**
 * Build the date-hour key and return the hex seed for that hour.
 * Used by PricingStatus and the executive report for consistent Global Price Seed.
 */
export function getHexSeedForHour(now: Date, effectiveHour: number): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(effectiveHour).padStart(2, "0");
  return deriveHexSeed(`${yyyy}-${mm}-${dd}-${hh}`);
}
