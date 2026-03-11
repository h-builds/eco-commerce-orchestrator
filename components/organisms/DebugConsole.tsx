'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTelemetry } from '@/lib/TelemetryContext';
import type { TelemetryEntry } from '@/lib/wasmTelemetry';

const LOG_ROW_HEIGHT = 24;
const VIRTUAL_THRESHOLD = 100;
const CONSOLE_FONT = 'JetBrains Mono, ui-monospace, monospace';

function LogLine({ entry }: { entry: TelemetryEntry }) {
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
        No logs yet. Navigate to the Admin Dashboard with ?debug=true to stream
        Wasm pricing metrics.
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
  const { logs, clearLogs, pauseStream, setPauseStream, exportSessionMetrics } =
    useTelemetry();

  if (!isConsoleOpen) {
    return (
      <button
        type="button"
        onClick={() => setConsoleOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-black border-2 border-emerald-500/80 text-emerald-400 shadow-lg shadow-emerald-500/20 hover:bg-emerald-950/80 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/50"
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
      className="fixed bottom-0 right-0 z-[9999] flex w-full max-w-lg flex-col rounded-tl-2xl border border-cyan-500/30 bg-black shadow-2xl shadow-cyan-500/10 md:max-w-xl"
      style={{ fontFamily: CONSOLE_FONT }}
      role="region"
      aria-label="Developer Debug Console"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 bg-slate-950/90 px-4 py-2">
        <span className="text-sm font-bold tracking-wider text-cyan-400">
          Tech Pulse — Wasm Pricing Telemetry
        </span>
        <button
          type="button"
          onClick={() => setConsoleOpen(false)}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          aria-label="Minimize debug console"
        >
          <span className="material-symbols-outlined text-lg">remove</span>
        </button>
      </div>

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
      </div>
    </div>
  );
}
