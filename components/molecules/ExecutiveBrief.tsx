"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { useSimulation } from "../../lib/SimulationContext";
import { getEfficiencyForHour } from "../../lib/efficiencyScore";

/**
 * Telemetry summarizer for Edge performance metrics. Implements
 * high-frequency numerical tweening via Framer Motion's `animate` to
 * maintain UI fluidity during rapid simulation state transitions.
 */
export function ExecutiveBrief() {
  const { simulatedHour } = useSimulation();
  const effectiveHour =
    simulatedHour !== null ? simulatedHour : new Date().getHours();
  const targetEfficiency = getEfficiencyForHour(effectiveHour);

  const [displayValue, setDisplayValue] = useState(targetEfficiency);
  const displayRef = useRef(targetEfficiency);
  // TODO: displayRef.current = displayValue;

  useEffect(() => {
    const from = displayRef.current;
    const controls = animate(from, targetEfficiency, {
      duration: 0.4,
      ease: "easeOut",
      onUpdate: (value: number) => {
        displayRef.current = value;
        setDisplayValue(value);
      },
    });
    return () => controls.stop();
  }, [targetEfficiency]);

  const displayPercent = Math.round(displayValue);

  return (
    <div
      className="max-w-md rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-md shadow-2xl"
      role="region"
      aria-label="Executive Brief">
      <p className="text-xs text-slate-400 leading-relaxed">
        <strong className="text-slate-200">Executive Brief:</strong> Real-time
        Edge efficiency is currently at{" "}
        <strong
          className="text-slate-200 tabular-nums"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${displayPercent} percent`}>
          {displayPercent}%
        </strong>{" "}
        based on ISR cache hit ratio and Wasm execution cycles.
      </p>
    </div>
  );
}
