'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTelemetry } from '@/lib/TelemetryContext';
import { useStressTestRegistry } from '@/components/providers/StressTestRegistryProvider';
import type { TelemetryEntry } from '@/lib/wasmTelemetry';

const LOG_ROW_HEIGHT = 24;
const VIRTUAL_THRESHOLD = 100;
const CONSOLE_FONT = 'JetBrains Mono, ui-monospace, monospace';

function LogLine({ entry }: { entry: TelemetryEntry }) {
  // System/info messages (e.g. pipeline-init sentinel)
  if (entry.message) {
    return (
      <div
        className="font-mono text-xs leading-6 text-cyan-400 whitespace-nowrap"
        style={{ fontFamily: CONSOLE_FONT }}
        role="listitem"
      >
        {entry.message}
      </div>
    );
  }

  const ms = entry.executionTimeMs;
  const colorClass =
    ms < 1
      ? 'text-emerald-400'
      : ms <= 3
        ? 'text-amber-400'
        : 'text-red-400';

  const seedPart = entry.seedHex ? ` | Seed: ${entry.seedHex}` : '';
  const memPart = entry.memoryMb != null ? ` | Mem: ${entry.memoryMb}MB` : '';

  return (
    <div
      className={`font-mono text-xs leading-6 whitespace-nowrap ${colorClass}`}
      style={{ fontFamily: CONSOLE_FONT }}
      role="listitem"
    >
      [Wasm-Go] Processed {entry.batchSize} items in {ms.toFixed(2)}ms
      {seedPart}
      {memPart}
    </div>
  );
}

function LogList({ logs }: { logs: TelemetryEntry[] }) {
  'use no memo';
  const parentRef = useRef<HTMLDivElement>(null);
  const useVirtual = logs.length > VIRTUAL_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => LOG_ROW_HEIGHT,
    overscan: 10,
  });

  if (logs.length === 0) {
    return (
      <div
        className="text-slate-500 font-mono text-xs p-4"
        style={{ fontFamily: CONSOLE_FONT }}
      >
        No logs yet. Visit the Analytics Dashboard or browse the Shop to stream
        live Wasm pricing metrics. Press{' '}
        <kbd className="rounded bg-slate-800 px-1 py-0.5 text-cyan-400">Ctrl+Shift+D</kbd>{' '}
        to toggle this console at any time.
      </div>
    );
  }

  if (!useVirtual) {
    return (
      <div className="flex flex-col gap-0 p-2">
        {logs.map((entry) => (
          <LogLine key={entry.id} entry={entry} />
        ))}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={logs[virtualRow.index].id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
            className="flex items-center px-2"
          >
            <LogLine entry={logs[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface DebugConsoleProps {
  isConsoleOpen: boolean;
  setConsoleOpen: (open: boolean) => void;
}

export function DebugConsole({ isConsoleOpen, setConsoleOpen }: DebugConsoleProps) {
  const {
    logs,
    clearLogs,
    pauseStream,
    setPauseStream,
    exportSessionMetrics,
    stressTestStatus,
    launchStressTest,
  } = useTelemetry();
  const { products: stressTestProducts, simulatedHour } = useStressTestRegistry();

  const canRunStressTest =
    stressTestProducts.length > 0 && !stressTestStatus.active;
  const progressPercent =
    stressTestStatus.total > 0
      ? Math.round((stressTestStatus.progress / stressTestStatus.total) * 100)
      : 0;

  if (!isConsoleOpen) {
    return (
      <button
        type="button"
        onClick={() => setConsoleOpen(true)}
        className="tour-debug-console fixed bottom-6 z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-black border-2 border-emerald-500/80 text-emerald-400 shadow-lg shadow-emerald-500/20 hover:bg-emerald-950/80 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/50"
        style={{ right: 'max(1.5rem, calc(50vw - 720px + 1.5rem))' }}
        aria-label="Open debug console"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          terminal
        </span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-0 z-[9999] flex w-[min(100vw,600px)] flex-col rounded-tl-2xl bg-white/5 backdrop-blur-md shadow-2xl ${
        stressTestStatus.active
          ? 'border-2 border-red-500/80 shadow-red-500/20'
          : 'border border-white/10 shadow-black/50'
      }`}
      style={{ fontFamily: CONSOLE_FONT, right: 'max(0px, calc(50vw - 720px))' }}
      role="region"
      aria-label="Developer Debug Console"
    >
      {/* Header — color indicates stress test active */}
      <div
        className={`flex items-center justify-between border-b px-4 py-2 ${
          stressTestStatus.active
            ? 'border-red-500/50 bg-red-950/40'
            : 'border-white/10 bg-transparent'
        }`}
      >
        <span
          className={`text-sm font-bold tracking-wider ${
            stressTestStatus.active ? 'text-red-400' : 'text-cyan-400'
          }`}
        >
          {stressTestStatus.active
            ? 'System Overload Simulation — Running'
            : 'Tech Pulse — Wasm Pricing Telemetry'}
        </span>
        <button
          type="button"
          onClick={() => setConsoleOpen(false)}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          aria-label="Minimize debug console"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">remove</span>
        </button>
      </div>

      {/* Stress test progress bar */}
      {stressTestStatus.active && (
        <div className="border-b border-red-500/30 bg-slate-950/90 px-4 py-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-red-500 transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={stressTestStatus.progress}
              aria-valuemin={0}
              aria-valuemax={stressTestStatus.total}
              aria-label="Stress test progress"
            />
          </div>
          <p className="mt-1 text-[10px] font-mono text-red-400/90">
            {stressTestStatus.progress} / {stressTestStatus.total} items
          </p>
        </div>
      )}

      {/* Post-test summary */}
      {stressTestStatus.summary && !stressTestStatus.active && (
        <div className="border-b border-emerald-500/30 bg-emerald-950/20 px-4 py-2">
          <p
            className="text-xs font-mono text-emerald-400"
            style={{ fontFamily: CONSOLE_FONT }}
          >
            {stressTestStatus.summary}
          </p>
        </div>
      )}

      {/* Terminal area */}
      <div className="min-h-[200px] max-h-[320px] overflow-hidden border-b border-cyan-500/20 bg-black">
        <LogList logs={logs} />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 border-t border-cyan-500/20 bg-slate-950/90 px-4 py-2">
        <button
          type="button"
          onClick={clearLogs}
          className="rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          Clear Logs
        </button>
        <button
          type="button"
          onClick={() => setPauseStream(!pauseStream)}
          className={`rounded px-3 py-1.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
            pauseStream
              ? 'bg-amber-900/50 text-amber-400'
              : 'bg-slate-800 text-cyan-400 hover:bg-slate-700'
          }`}
        >
          {pauseStream ? 'Resume Stream' : 'Pause Stream'}
        </button>
        <button
          type="button"
          onClick={exportSessionMetrics}
          className="rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          Export Session Metrics
        </button>
        <button
          type="button"
          onClick={() => launchStressTest(stressTestProducts, simulatedHour)}
          disabled={!canRunStressTest}
          title={
            canRunStressTest
              ? 'Re-calculate all 1,000 items and stream results to console'
              : 'Visit the Analytics Dashboard first to load the product batch'
          }
          className="flex items-center gap-1.5 rounded border-2 border-red-500/80 bg-red-950/40 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-900/50 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <span
            className={`material-symbols-outlined text-sm ${
              stressTestStatus.active ? 'animate-pulse' : ''
            }`}
            aria-hidden="true"
          >
            rocket_launch
          </span>
          Launch Stress Test
        </button>
      </div>
    </div>
  );
}
