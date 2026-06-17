'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  startHUDTelemetry,
  stopHUDTelemetry,
  getHUDMetrics,
} from '@/lib/hudTelemetry';

/**
 * Live Telemetry HUD — Command Center overlay for the Shop view.
 *
 * Renders real-time architectural metrics (WASM status, price validations,
 * main-thread jitter, edge RTT) using direct DOM mutations via refs.
 * Never triggers React re-renders in the product grid.
 */
export function TelemetryHUD() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wasmDotRef = useRef<HTMLSpanElement>(null);
  const wasmLabelRef = useRef<HTMLSpanElement>(null);
  const wasmProcRef = useRef<HTMLSpanElement>(null);
  const jitterRef = useRef<HTMLSpanElement>(null);
  const jitterRowRef = useRef<HTMLDivElement>(null);
  const rttRef = useRef<HTMLSpanElement>(null);
  const batchRef = useRef<HTMLSpanElement>(null);
  const batchRowRef = useRef<HTMLDivElement>(null);
  const paintRafRef = useRef(0);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const showTooltip = useCallback(() => setTooltipVisible(true), []);
  const hideTooltip = useCallback(() => setTooltipVisible(false), []);

  useEffect(() => {
    startHUDTelemetry();

    function paint() {
      const m = getHUDMetrics();

      if (wasmDotRef.current) {
        wasmDotRef.current.style.color = m.wasmActive ? '#22c55e' : '#64748b';
      }
      if (wasmLabelRef.current) {
        wasmLabelRef.current.textContent = m.wasmActive ? '[ACTIVE]' : '[STANDBY]';
        wasmLabelRef.current.style.color = m.wasmActive ? '#22c55e' : '#64748b';
      }

      if (wasmProcRef.current) {
        const formatted = m.wasmProcessed.toLocaleString();
        wasmProcRef.current.textContent = `${formatted} / ${formatted}`;
      }

      if (jitterRef.current) {
        jitterRef.current.textContent = `${m.jitterMs.toFixed(1)}ms`;
      }
      if (jitterRowRef.current) {
        jitterRowRef.current.style.color = m.jitterMs < 2 ? '#22c55e' : '#f59e0b';
      }

      if (rttRef.current) {
        rttRef.current.textContent = `${m.edgeRttMs}ms`;
      }

      if (batchRef.current) {
        batchRef.current.textContent = m.batchTotal > 0
          ? `${m.batchCompleted} / ${m.batchTotal}`
          : '—';
      }
      if (batchRowRef.current) {
        batchRowRef.current.style.display = m.batchTotal > 0 ? 'flex' : 'none';
      }

      if (containerRef.current) {
        if (m.highlightColor === 'cyan') {
          containerRef.current.classList.add('ring-4', 'ring-cyan-500/50', 'scale-[1.02]');
        } else if (m.highlightColor === 'amber') {
          containerRef.current.classList.remove('shadow-[0_0_20px_rgba(0,255,255,0.15)]');
          containerRef.current.classList.add('shadow-[0_0_20px_rgba(245,158,11,0.5)]', 'ring-2', 'ring-amber-500');
        } else {
          containerRef.current.classList.remove('ring-4', 'ring-cyan-500/50', 'scale-[1.02]');
          containerRef.current.classList.remove('shadow-[0_0_20px_rgba(245,158,11,0.5)]', 'ring-2', 'ring-amber-500');
          containerRef.current.classList.add('shadow-[0_0_20px_rgba(0,255,255,0.15)]');
        }
      }

      paintRafRef.current = requestAnimationFrame(paint);
    }

    paintRafRef.current = requestAnimationFrame(paint);

    return () => {
      stopHUDTelemetry();
      cancelAnimationFrame(paintRafRef.current);
    };
  }, []);

  return (
    <div
      id="telemetry-hud"
      role="region"
      ref={containerRef}
      aria-label="Live telemetry dashboard"
      className="
        fixed bottom-6 left-6 z-50
        font-[family-name:var(--font-geist-mono)]
        text-[11px] leading-relaxed tracking-wide
        bg-slate-950/85 backdrop-blur-md
        border border-cyan-500/20
        rounded-lg px-4 py-3
        shadow-[0_0_20px_rgba(0,255,255,0.15)]
        select-none pointer-events-auto
        min-w-[260px] transition-all duration-300
      "
    >
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-cyan-500/10">
        <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-widest">
          Live Telemetry
        </span>

        <div className="relative">
          <button
            type="button"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
            aria-describedby="hud-tooltip"
            aria-label="Technical information about main thread liberation"
            className="
              text-cyan-400 hover:text-cyan-300 transition-colors
              flex items-center justify-center w-5 h-5 rounded
              focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50
            "
          >
            <span className="material-symbols-outlined notranslate text-[16px]" aria-hidden="true" translate="no">
              info
            </span>
          </button>

          {tooltipVisible && (
            <div
              id="hud-tooltip"
              role="tooltip"
              className="
                absolute bottom-7 left-0
                w-64 px-3 py-2
                bg-slate-900 border border-cyan-500/20
                rounded-md text-[10px] text-slate-300 leading-snug
                shadow-lg shadow-cyan-900/20
                pointer-events-none
              "
            >
              <span className="font-bold text-cyan-400">Main Thread Liberation:</span>{' '}
              UI remains responsive at 60fps while Go‑Wasm orchestrates pricing logic at the Edge.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-slate-300">
        <span className="text-slate-400">WASM_ENGINE:</span>
        <span
          ref={wasmDotRef}
          className="animate-pulse text-green-500"
          aria-hidden="true"
        >
          ●
        </span>
        <span ref={wasmLabelRef} className="text-green-500 font-bold">
          [ACTIVE]
        </span>
      </div>

      <div className="flex items-center gap-2 text-slate-300 mt-0.5">
        <span className="text-slate-400">WASM_PROC:</span>
        <span ref={wasmProcRef} className="text-cyan-400" aria-hidden="true">
          0 / 0
        </span>
      </div>

      <div
        ref={jitterRowRef}
        className="flex items-center gap-2 mt-0.5"
        style={{ color: '#22c55e' }}
      >
        <span className="text-slate-400">UI_JITTER:</span>
        <span ref={jitterRef} aria-hidden="true">0.0ms</span>
      </div>

      <div className="flex items-center gap-2 text-slate-300 mt-0.5">
        <span className="text-slate-400">EDGE_RTT:</span>
        <span ref={rttRef} className="text-cyan-400" aria-hidden="true">
          —ms
        </span>
      </div>

      <div
        ref={batchRowRef}
        className="flex items-center gap-2 text-slate-300 mt-0.5"
        style={{ display: 'none' }}
      >
        <span className="text-slate-400">EDGE_BATCH:</span>
        <span ref={batchRef} className="text-emerald-400 font-bold" aria-hidden="true">
          —
        </span>
      </div>
    </div>
  );
}
