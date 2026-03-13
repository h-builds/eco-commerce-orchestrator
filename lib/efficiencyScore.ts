/**
 * Sinusoidal efficiency modeling inverse to the e-commerce traffic cycle. 
 * Peaks at 04:00 (off-peak) and valleys at 16:00 (peak load) to simulate 
 * deterministic Edge compute overhead and resource contention across 
 * stateless Worker nodes.
 */
export function getEfficiencyForHour(hour: number): number {
  const h = Math.max(0, Math.min(23, Math.floor(hour)));
  const value = 92 + 4 * Math.cos((2 * Math.PI * (h - 4)) / 24);
  const rounded = Math.round(value);
  return Math.max(88, Math.min(96, rounded));
}
