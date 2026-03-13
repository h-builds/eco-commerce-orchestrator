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
    ? "shadow-[0_0_20px_rgba(245,158,11,0.15)]"
    : "shadow-[0_0_20px_rgba(34,211,238,0.15)]";
  const borderClass = isSimulating
    ? "border-amber-500/50"
    : "border-cyan-500/30";
  const sliderPercent = ((sliderHour / 23) * 100).toFixed(1);

  return (
    <aside
      aria-label="Real-time pricing status"
      className={[
        "w-full rounded-2xl border relative overflow-hidden",
        borderClass,
        "bg-slate-900/80 backdrop-blur-xl",
        "p-6 mb-8",
        glowClass,
        "transition-all duration-500",
      ].join(" ")}>
      {/* Decorative top-right corner blur */}
      <div className={`absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${isSimulating ? "bg-amber-500/10" : "bg-cyan-500/10"}`} />

      {/* ── Title row ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-3 relative z-10">
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
          className={`text-xs font-black uppercase tracking-[0.2em] transition-colors duration-300 ${labelColor}`}>
          {isSimulating ? "Simulation Mode" : "Edge Pricing Engine"}
        </span>
        <span className="ml-auto text-[10px] uppercase font-bold tracking-widest text-slate-500 border border-slate-800 bg-slate-950 px-2 py-1 rounded-full">
          Go-Wasm Core
        </span>
      </div>

      {/* ── Data chips ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 relative z-10">
        {/* Last Network Sync */}
        <div className="flex flex-col bg-slate-950/50 rounded-xl p-4 border border-slate-800/80">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
            {isSimulating ? "Simulated Hour" : "Last Network Sync"}
          </span>
          <span
            className="font-mono text-2xl font-bold text-white tabular-nums tracking-tight"
            aria-live="polite"
            aria-atomic="true">
            {lastSyncLabel}
          </span>
        </div>

        {/* Next Adjustment Countdown */}
        <div className="flex flex-col bg-slate-950/50 rounded-xl p-4 border border-slate-800/80">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
            Next Price Shift
          </span>
          <span
            className="font-mono text-2xl font-bold text-cyan-400 tabular-nums tracking-tight"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`Next price shift in ${minsLeft} minutes and ${secsLeft} seconds`}>
            {countdown}
          </span>
        </div>

        {/* Global Price Seed */}
        <div className="flex flex-col bg-slate-950/50 rounded-xl p-4 border border-slate-800/80">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
            Global Price Seed
          </span>
          <span
            className={`font-mono text-2xl font-bold tracking-tight transition-colors duration-300 ${isSimulating ? "text-amber-400" : "text-violet-400"}`}
            aria-label={`Deterministic edge price seed: 0x${hexSeed}`}>
            0x{hexSeed}
          </span>
        </div>
      </div>

      {/* ── Time Machine ──────────────────────────────────────────── */}
      <div
        className={[
          "tour-time-machine mt-6 pt-5 border-t transition-colors duration-300 relative z-10",
          isSimulating ? "border-amber-500/30" : "border-slate-800",
        ].join(" ")}
        role="group"
        aria-label="Time simulation controls">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-base text-slate-400"
              aria-hidden="true">
              schedule
            </span>
            <label
              htmlFor="time-travel-slider"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              Time Machine
            </label>
            {isSimulating && (
              <span className="ml-2 text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded backdrop-blur bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Simulating
              </span>
            )}
          </div>
          {isSimulating && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
              aria-label="Reset to live system time">
              <span
                className="material-symbols-outlined text-sm"
                aria-hidden="true">
                power_settings_new
              </span>
              Abort Sim
            </button>
          )}
        </div>

        {/* Slider row */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono font-bold text-slate-500 w-12 shrink-0 text-right">
            00:00
          </span>

          {/* Styled range input */}
          <div className="relative flex-1 group/slider py-2">
            {/* Track background */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-slate-800 border border-slate-700/50 pointer-events-none" />
            
            {/* Track fill bar — amber when simulating */}
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full pointer-events-none transition-colors duration-300 ${isSimulating ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"}`}
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
                "w-full h-2 appearance-none cursor-pointer bg-transparent",
                "[&::-webkit-slider-thumb]:appearance-none",
                "[&::-webkit-slider-thumb]:h-5",
                "[&::-webkit-slider-thumb]:w-5",
                "[&::-webkit-slider-thumb]:rounded-md",
                "[&::-webkit-slider-thumb]:border-2",
                isSimulating
                  ? "[&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:border-white"
                  : "[&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:border-white",
                "[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                "[&::-webkit-slider-thumb]:transition-all",
                "[&::-webkit-slider-thumb]:hover:scale-125",
                "[&::-moz-range-thumb]:h-5",
                "[&::-moz-range-thumb]:w-5",
                "[&::-moz-range-thumb]:rounded-md",
                "[&::-moz-range-thumb]:border-2",
                "[&::-moz-range-thumb]:cursor-pointer",
                isSimulating
                  ? "[&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-white"
                  : "[&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:border-white",
                "focus:outline-none",
                isSimulating
                  ? "focus-visible:ring-2 focus-visible:ring-amber-400/50"
                  : "focus-visible:ring-2 focus-visible:ring-cyan-400/50",
                "relative z-10",
              ].join(" ")}
            />
          </div>

          <span className="text-xs font-mono font-bold text-slate-500 w-12 shrink-0">
            23:00
          </span>
        </div>

        {/* Current slider value label */}
        <div className="mt-4 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
            {isSimulating ? "Target Validation Matrix" : "Drag to forecast"}
          </span>
          <span
            className={`font-mono text-lg font-black tracking-widest transition-colors duration-300 rounded border px-4 py-1.5 ${
              isSimulating 
                ? "text-amber-400 border-amber-500/30 bg-amber-500/10" 
                : "text-slate-400 border-slate-700 bg-slate-800"
            }`}
            aria-live="polite"
            aria-atomic="true">
            {formatHour(sliderHour)}
          </span>
        </div>
      </div>
    </aside>
  );
}
