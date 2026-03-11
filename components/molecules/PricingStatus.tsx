'use client';

import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Deterministic hex seed — mirrors the Go agent's hourly seed derivation.
// Input: "YYYY-MM-DD-HH" string → djb2-style hash → 8-char uppercase hex.
// ---------------------------------------------------------------------------
function deriveHexSeed(dateHourKey: string): string {
  let hash = 5381;
  for (let i = 0; i < dateHourKey.length; i++) {
    // djb2: hash = hash * 33 ^ char
    hash = ((hash << 5) + hash) ^ dateHourKey.charCodeAt(i);
    hash = hash >>> 0; // keep it an unsigned 32-bit integer
  }
  return hash.toString(16).toUpperCase().padStart(8, '0');
}

// ---------------------------------------------------------------------------
// Clock state — everything derived from Date.now() in one go.
// ---------------------------------------------------------------------------
interface ClockState {
  lastSyncLabel: string;  // e.g. "2:00 PM"
  minsLeft: number;
  secsLeft: number;
  hexSeed: string;
}

function computeClockState(now: Date): ClockState {
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  // Top of the current hour
  const suffix = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 || 12;
  const lastSyncLabel = `${displayHour}:00 ${suffix}`;

  // Time remaining until next full hour
  const totalSecsLeft = (59 - m) * 60 + (60 - s);
  const minsLeft = Math.floor(totalSecsLeft / 60);
  const secsLeft = totalSecsLeft % 60;

  // Hex seed: "YYYY-MM-DD-HH" (zero-padded)
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(h).padStart(2, '0');
  const hexSeed = deriveHexSeed(`${yyyy}-${mm}-${dd}-${hh}`);

  return { lastSyncLabel, minsLeft, secsLeft, hexSeed };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PricingStatus() {
  const [clock, setClock] = useState<ClockState>(() =>
    computeClockState(new Date())
  );

  useEffect(() => {
    // Tick every second so the countdown is smooth.
    const id = setInterval(() => {
      setClock(computeClockState(new Date()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const { lastSyncLabel, minsLeft, secsLeft, hexSeed } = clock;
  const countdown = `${String(minsLeft).padStart(2, '0')}:${String(secsLeft).padStart(2, '0')}`;

  return (
    <aside
      aria-label="Real-time pricing status"
      className={[
        'w-full rounded-xl border border-slate-700/60',
        'bg-slate-900 dark:bg-slate-950',
        'px-4 py-3 mb-8',
        'shadow-[0_0_24px_-4px_rgba(16,185,129,0.15)]',
      ].join(' ')}
    >
      {/* ── Title row ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        {/* Pulsing live indicator */}
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-400">
          Edge Pricing Engine
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
            Last Network Sync
          </span>
          <span
            className="font-mono text-lg font-bold text-slate-100 tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
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
            aria-label={`Next price shift in ${minsLeft} minutes and ${secsLeft} seconds`}
          >
            {countdown}
          </span>
        </div>

        {/* Global Price Seed */}
        <div className="flex flex-col gap-0.5 sm:pl-6">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
            Global Price Seed
          </span>
          <span
            className="font-mono text-lg font-bold text-violet-400 tracking-wider"
            aria-label={`Deterministic edge price seed: 0x${hexSeed}`}
          >
            0x{hexSeed}
          </span>
        </div>
      </div>
    </aside>
  );
}
