/**
 * Sinusoidal efficiency score by hour (0–23).
 * Efficiency(h) = 92 + 4·cos(2π(h−4)/24)
 * Peak 96% at 4:00 AM, valley 88% at 4:00 PM (e-commerce traffic cycle).
 */
export function getEfficiencyForHour(hour: number): number {
  const h = Math.max(0, Math.min(23, Math.floor(hour)));
  const value = 92 + 4 * Math.cos((2 * Math.PI * (h - 4)) / 24);
  const rounded = Math.round(value);
  return Math.max(88, Math.min(96, rounded));
}
