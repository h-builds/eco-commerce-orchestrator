"use client";

import {
  useEffect,
  useState,
  useDeferredValue,
  useCallback,
  useMemo,
} from "react";
import { useSimulation } from "@/lib/SimulationContext";
import { getHexSeedForHour } from "@/lib/hexSeed";

// ---------------------------------------------------------------------------
// Clock state — everything derived from a given hour in one go.
// ---------------------------------------------------------------------------
interface ClockState {
  lastSyncLabel: string; // e.g. "2:00 PM"
  minsLeft: number;
  secsLeft: number;
  hexSeed: string;
}

/**
 * computeClockState
 * @param now      The real current date (used for date parts + live countdown)
 * @param simHour  Overrides the hour for seed + sync label when non-null
 */
function computeClockState(now: Date, simHour: number | null): ClockState {
  const effectiveHour = simHour !== null ? simHour : now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  // Top of the effective hour
  const suffix = effectiveHour >= 12 ? "PM" : "AM";
  const displayHour = effectiveHour % 12 || 12;
  const lastSyncLabel = `${displayHour}:00 ${suffix}`;

  // Countdown always reflects real remaining time in the current hour
  const totalSecsLeft = (59 - m) * 60 + (60 - s);
  const minsLeft = Math.floor(totalSecsLeft / 60);
  const secsLeft = totalSecsLeft % 60;

  // Hex seed uses the effective hour so simulated seeds are correct
  const hexSeed = getHexSeedForHour(now, effectiveHour);

  return { lastSyncLabel, minsLeft, secsLeft, hexSeed };
}

// ---------------------------------------------------------------------------
// Hour formatting helper
// ---------------------------------------------------------------------------
function formatHour(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h % 12 || 12;
  return `${display}:00 ${suffix}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PricingStatus() {
  const { simulatedHour, setSimulatedHour } = useSimulation();

  // Slider local state.
  // Initialised to 0 (SSR-safe — no Date call during server render).
  // Synced to the real current hour on the client via useEffect.
  // This prevents a server/client hydration mismatch that causes a 500.
  const [sliderHour, setSliderHour] = useState<number>(0);

  useEffect(() => {
    setSliderHour(new Date().getHours());
  }, []);

  // Deferred value: heavy consumers only see this after React schedules them
  const deferredSimHour = useDeferredValue(simulatedHour);

  // Tick counter — incremented every second by the interval.
  // The effect body never calls setClock directly, avoiding the
  // "setState inside effect" cascading render antipattern.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []); // run once — the interval is never torn down unnecessarily

  // Derive the full clock state during render via useMemo.
  // Re-derives whenever the second ticks OR the deferred sim hour settles.
  const clock = useMemo(
    () => computeClockState(new Date(), deferredSimHour),
    // `tick` is the only signal that a second has passed;
    // `deferredSimHour` re-derives when the slider settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick, deferredSimHour],
  );

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const h = Number(e.target.value);
      setSliderHour(h);
      setSimulatedHour(h);
    },
    [setSimulatedHour],
  );

  const handleReset = useCallback(() => {
    setSimulatedHour(null);
    setSliderHour(new Date().getHours());
  }, [setSimulatedHour]);

  const isSimulating = simulatedHour !== null;
  const { lastSyncLabel, minsLeft, secsLeft, hexSeed } = clock;
  const countdown = `${String(minsLeft).padStart(2, "0")}:${String(secsLeft).padStart(2, "0")}`;

  // ── Palette tokens — switch between Emerald (live) and Amber (sim) ──────
  const pingColor = isSimulating ? "bg-amber-400" : "bg-emerald-400";
  const dotColor = isSimulating ? "bg-amber-500" : "bg-emerald-500";
  const labelColor = isSimulating ? "text-amber-400" : "text-emerald-400";
  const glowClass = isSimulating
    ? "shadow-[0_0_12px_-4px_rgba(245,158,11,0.1)]"
    : "shadow-[0_0_12px_-4px_rgba(16,185,129,0.1)]";
  const borderClass = isSimulating
    ? "border-amber-700/40"
    : "border-white/10";
  const sliderPercent = ((sliderHour / 23) * 100).toFixed(1);

  return (
    <aside
      aria-label="Real-time pricing status"
      className={[
        "w-full rounded-xl border",
        borderClass,
        "bg-white/5 backdrop-blur-md",
        "px-4 py-3 mb-8",
        glowClass,
        "transition-all duration-500",
      ].join(" ")}>
      {/* ── Title row ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        {/* Pulsing live / sim indicator */}
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${pingColor}`}
          />
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`}
          />
        </span>
        <span
          className={`text-[11px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${labelColor}`}>
          {isSimulating ? "Simulation Mode" : "Edge Pricing Engine"}
        </span>
        <span className="ml-auto text-[10px] text-slate-500 font-mono">
          Go-Wasm · Cloudflare Workers
        </span>
      </div>

      {/* ── Data chips ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:divide-x sm:divide-slate-700/50">
        {/* Last Network Sync */}
        <div className="flex flex-col gap-0.5 sm:pr-6">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
            {isSimulating ? "Simulated Hour" : "Last Network Sync"}
          </span>
          <span
            className="font-mono text-lg font-bold text-slate-100 tabular-nums"
            aria-live="polite"
            aria-atomic="true">
            {lastSyncLabel}
          </span>
        </div>

        {/* Next Adjustment Countdown */}
        <div className="flex flex-col gap-0.5 sm:px-6">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
            Next Price Shift
          </span>
          <span
            className="font-mono text-lg font-bold text-cyan-400 tabular-nums"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`Next price shift in ${minsLeft} minutes and ${secsLeft} seconds`}>
            {countdown}
          </span>
        </div>

        {/* Global Price Seed */}
        <div className="flex flex-col gap-0.5 sm:pl-6">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
            Global Price Seed
          </span>
          <span
            className={`font-mono text-lg font-bold tracking-wider transition-colors duration-300 ${isSimulating ? "text-amber-400" : "text-violet-400"}`}
            aria-label={`Deterministic edge price seed: 0x${hexSeed}`}>
            0x{hexSeed}
          </span>
        </div>
      </div>

      {/* ── Time Machine ──────────────────────────────────────────── */}
      <div
        className={[
          "tour-time-machine mt-4 pt-4 border-t transition-colors duration-300",
          isSimulating ? "border-amber-700/30" : "border-slate-700/40",
        ].join(" ")}
        role="group"
        aria-label="Time simulation controls">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className="material-symbols-outlined text-sm text-slate-400"
              aria-hidden="true">
              schedule
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Time Machine
            </span>
            {isSimulating && (
              <span className="ml-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Active
              </span>
            )}
          </div>
          {isSimulating && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 rounded px-1"
              aria-label="Reset to live system time">
              <span
                className="material-symbols-outlined text-xs"
                aria-hidden="true">
                replay
              </span>
              Reset to Live
            </button>
          )}
        </div>

        {/* Slider row */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500 w-10 shrink-0 text-right">
            00:00
          </span>

          {/* Styled range input */}
          <div className="relative flex-1 group/slider">
            {/* Track fill bar — amber when simulating */}
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full pointer-events-none transition-colors duration-300 ${isSimulating ? "bg-amber-500" : "bg-slate-600"}`}
              style={{ width: `${sliderPercent}%` }}
              aria-hidden="true"
            />
            <input
              id="time-travel-slider"
              type="range"
              min={0}
              max={23}
              step={1}
              value={sliderHour}
              onChange={handleSliderChange}
              aria-label={`Simulate hour: currently ${formatHour(sliderHour)}`}
              aria-valuetext={formatHour(sliderHour)}
              className={[
                "w-full h-1.5 rounded-full appearance-none cursor-pointer",
                "bg-slate-700/60",
                "[&::-webkit-slider-thumb]:appearance-none",
                "[&::-webkit-slider-thumb]:h-4",
                "[&::-webkit-slider-thumb]:w-4",
                "[&::-webkit-slider-thumb]:rounded-full",
                "[&::-webkit-slider-thumb]:border-2",
                isSimulating
                  ? "[&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:border-amber-300"
                  : "[&::-webkit-slider-thumb]:bg-slate-300 [&::-webkit-slider-thumb]:border-slate-400",
                "[&::-webkit-slider-thumb]:shadow-md",
                "[&::-webkit-slider-thumb]:transition-colors",
                "[&::-moz-range-thumb]:h-4",
                "[&::-moz-range-thumb]:w-4",
                "[&::-moz-range-thumb]:rounded-full",
                "[&::-moz-range-thumb]:border-2",
                "[&::-moz-range-thumb]:cursor-pointer",
                isSimulating
                  ? "[&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-amber-300"
                  : "[&::-moz-range-thumb]:bg-slate-300 [&::-moz-range-thumb]:border-slate-400",
                "focus:outline-none",
                isSimulating
                  ? "focus-visible:ring-2 focus-visible:ring-amber-400/50"
                  : "focus-visible:ring-2 focus-visible:ring-slate-400/50",
                "relative z-10",
              ].join(" ")}
            />
          </div>

          <span className="text-[10px] font-mono text-slate-500 w-10 shrink-0">
            23:00
          </span>
        </div>

        {/* Current slider value label */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <span
            className={`font-mono text-sm font-bold transition-colors duration-300 ${isSimulating ? "text-amber-400" : "text-slate-500"}`}
            aria-live="polite"
            aria-atomic="true">
            {isSimulating
              ? `Simulating: ${formatHour(sliderHour)}`
              : `Drag to simulate an hour (currently ${formatHour(sliderHour)})`}
          </span>
        </div>
      </div>
    </aside>
  );
}
