'use client';

import { startTransition, useState, useEffect } from 'react';
import { useSimulation } from '@/lib/SimulationContext';
import { triggerGlobalRevaluation } from '@/lib/stressTest';
import { WasmTelemetry } from '@/lib/wasmTelemetry';

interface StressTestProduct {
  id: string;
  price: number;
  stock: number;
  name?: string;
}

interface StressTestTriggerProps {
  products: StressTestProduct[];
}

/**
 * Orchestrates global Wasm revaluation cycles to stress-test Edge pricing 
 * logic. Leverages React `startTransition` to decouple high-concurrency 
 * execution cycles from the rendering main-thread, maintaining UI 
 * responsiveness during synthetic throughput spikes.
 */
export function StressTestTrigger({ products }: StressTestTriggerProps) {
  const { simulatedHour } = useSimulation();
  const [active, setActive] = useState(() => WasmTelemetry.getStressTestStatus().active);

  useEffect(() => {
    return WasmTelemetry.subscribeStressTest((status) => {
      setActive(status.active);
    });
  }, []);

  const canRun = products.length > 0 && !active;

  const handleLaunch = () => {
    if (!canRun) return;
    startTransition(() => {
      triggerGlobalRevaluation(products, simulatedHour);
    });
  };

  return (
    <button
      type="button"
      onClick={handleLaunch}
      disabled={!canRun}
      title={
        canRun
          ? 'Run system stress test: re-calculate all products and stream to Debug Console'
          : 'Open Debug Console with ?debug=true and ensure dashboard is loaded'
      }
      className="inline-flex items-center gap-2 rounded-lg border-2 border-red-500/80 bg-red-950/40 px-4 py-2 text-sm font-bold text-red-400 shadow-lg shadow-red-500/10 hover:bg-red-900/50 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/50"
    >
      <span
        className={`material-symbols-outlined notranslate text-lg ${active ? 'animate-pulse' : ''}`}
        aria-hidden="true"
       translate="no">
        rocket_launch
      </span>
      Launch Stress Test
    </button>
  );
}
