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
  const paintRafRef = useRef(0);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const showTooltip = useCallback(() => setTooltipVisible(true), []);
  const hideTooltip = useCallback(() => setTooltipVisible(false), []);

  useEffect(() => {
    startHUDTelemetry();

    function paint() {
      const m = getHUDMetrics();

      // WASM status indicator
      if (wasmDotRef.current) {
        wasmDotRef.current.style.color = m.wasmActive ? '#22c55e' : '#64748b';
      }
      if (wasmLabelRef.current) {
        wasmLabelRef.current.textContent = m.wasmActive ? '[ACTIVE]' : '[STANDBY]';
        wasmLabelRef.current.style.color = m.wasmActive ? '#22c55e' : '#64748b';
      }

      // WASM processed counter
      if (wasmProcRef.current) {
        const formatted = m.wasmProcessed.toLocaleString();
        wasmProcRef.current.textContent = `${formatted} / ${formatted}`;
      }

      // Frame jitter
      if (jitterRef.current) {
        jitterRef.current.textContent = `${m.jitterMs.toFixed(1)}ms`;
      }
      if (jitterRowRef.current) {
        jitterRowRef.current.style.color = m.jitterMs < 2 ? '#22c55e' : '#f59e0b';
      }

      // Edge RTT
      if (rttRef.current) {
        rttRef.current.textContent = `${m.edgeRttMs}ms`;
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
      ref={containerRef}
      role="status"
      aria-label="Live telemetry dashboard"
      className="
        fixed bottom-6 right-6 z-50
        font-[family-name:var(--font-geist-mono)]
        text-[11px] leading-relaxed tracking-wide
        bg-slate-950/85 backdrop-blur-md
        border border-cyan-500/20
        rounded-lg px-4 py-3
        shadow-[0_0_20px_rgba(0,255,255,0.15)]
        select-none pointer-events-auto
        min-w-[260px]
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-cyan-500/10">
        <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-widest">
          Live Telemetry
        </span>

        {/* Technical Info icon */}
        <div className="relative">
          <button
            type="button"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
            aria-label="Technical information about main thread liberation"
            className="
              text-cyan-500/60 hover:text-cyan-400 transition-colors
              flex items-center justify-center w-5 h-5 rounded
              focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50
            "
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              info
            </span>
          </button>

          {/* Tooltip */}
          {tooltipVisible && (
            <div
              role="tooltip"
              className="
                absolute bottom-7 right-0
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

      {/* WASM Engine Status */}
      <div className="flex items-center gap-2 text-slate-300">
        <span className="text-slate-500">WASM_ENGINE:</span>
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

      {/* Price Validations */}
      <div className="flex items-center gap-2 text-slate-300 mt-0.5">
        <span className="text-slate-500">WASM_PROC:</span>
        <span ref={wasmProcRef} className="text-cyan-400">
          0 / 0
        </span>
      </div>

      {/* Main Thread Jitter */}
      <div
        ref={jitterRowRef}
        className="flex items-center gap-2 mt-0.5"
        style={{ color: '#22c55e' }}
      >
        <span className="text-slate-500">UI_JITTER:</span>
        <span ref={jitterRef}>0.0ms</span>
      </div>

      {/* Edge Latency */}
      <div className="flex items-center gap-2 text-slate-300 mt-0.5">
        <span className="text-slate-500">EDGE_RTT:</span>
        <span ref={rttRef} className="text-cyan-400">
          —ms
        </span>
      </div>
    </div>
  );
}
