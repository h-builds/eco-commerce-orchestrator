/**
 * WasmTelemetry — singleton for capturing execution metrics of the Wasm pricing logic.
 * No React imports; consumed by TelemetryContext and runPricingBatch.
 */

export interface TelemetryEntry {
  id: string;
  timestamp: number;
  batchSize: number;
  executionTimeMs: number;
  seedHex?: string;
  memoryMb?: number;
}

export interface SessionMetrics {
  totalBatches: number;
  totalProducts: number;
  avgMsPerBatch: number;
  avgMsPerProduct: number;
  logs: TelemetryEntry[];
}

const MAX_LOGS = 500;
const logs: TelemetryEntry[] = [];
const subscribers = new Set<(entries: TelemetryEntry[]) => void>();

function getMemoryMb(): number | undefined {
  if (typeof performance === 'undefined') return undefined;
  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
  if (mem?.usedJSHeapSize != null) {
    return Math.round((mem.usedJSHeapSize / 1024 / 1024) * 100) / 100;
  }
  return undefined;
}

function notify(): void {
  const snapshot = [...logs];
  subscribers.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (_) {
      // ignore subscriber errors
    }
  });
}

export const WasmTelemetry = {
  pushEntry(entry: Omit<TelemetryEntry, 'id' | 'timestamp'>): void {
    const full: TelemetryEntry = {
      ...entry,
      id: `telem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };
    logs.push(full);
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }
    notify();
  },

  getLogs(): TelemetryEntry[] {
    return [...logs];
  },

  subscribe(fn: (entries: TelemetryEntry[]) => void): () => void {
    subscribers.add(fn);
    return () => {
      subscribers.delete(fn);
    };
  },

  clear(): void {
    logs.length = 0;
    notify();
  },

  getAverageExecutionTime(): number {
    if (logs.length === 0) return 0;
    const sum = logs.reduce((a, e) => a + e.executionTimeMs, 0);
    return sum / logs.length;
  },

  getSessionMetrics(): SessionMetrics {
    const totalBatches = logs.length;
    const totalProducts = logs.reduce((a, e) => a + e.batchSize, 0);
    const totalMs = logs.reduce((a, e) => a + e.executionTimeMs, 0);
    return {
      totalBatches,
      totalProducts,
      avgMsPerBatch: totalBatches > 0 ? totalMs / totalBatches : 0,
      avgMsPerProduct: totalProducts > 0 ? totalMs / totalProducts : 0,
      logs: [...logs],
    };
  },
};

/** Helper to capture memory when pushing from batch runner */
export function captureMemoryMb(): number | undefined {
  return getMemoryMb();
}
