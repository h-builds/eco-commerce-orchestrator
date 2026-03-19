/**
 * HUD Telemetry Engine — zero-overhead metrics collector for the TelemetryHUD.
 *
 * All values live in a plain mutable object read by the HUD's own rAF loop.
 * No React state, no subscriptions that trigger reconciliation.
 */

import { WasmTelemetry } from './wasmTelemetry';

export interface HUDMetrics {
  wasmActive: boolean;
  wasmProcessed: number;
  wasmTotal: number;
  jitterMs: number;
  edgeRttMs: number;
  batchCompleted: number;
  batchTotal: number;
}

const metrics: HUDMetrics = {
  wasmActive: true,
  wasmProcessed: 0,
  wasmTotal: 0,
  jitterMs: 0,
  edgeRttMs: 0,
  batchCompleted: 0,
  batchTotal: 0,
};

let running = false;
let rafId = 0;
let lastFrameTime = 0;
let rttIntervalId: ReturnType<typeof setInterval> | null = null;

// Exponential moving average coefficient — smooths jitter readings
const EMA_ALPHA = 0.15;

function measureJitter(now: number): void {
  if (lastFrameTime > 0) {
    const delta = now - lastFrameTime;
    const idealFrame = 16.667; // 60 fps
    const rawJitter = Math.abs(delta - idealFrame);
    metrics.jitterMs = metrics.jitterMs * (1 - EMA_ALPHA) + rawJitter * EMA_ALPHA;
  }
  lastFrameTime = now;
}

function syncWasmMetrics(): void {
  const session = WasmTelemetry.getSessionMetrics();
  metrics.wasmProcessed = session.totalProducts;
  metrics.wasmTotal = session.totalProducts;

  const stress = WasmTelemetry.getStressTestStatus();
  metrics.wasmActive = stress.active || session.totalBatches > 0;

  // Batch progress: derive from stress test total using 500-item chunks
  if (stress.active && stress.total > 0) {
    const batchSize = 500;
    metrics.batchTotal = Math.ceil(stress.total / batchSize);
    metrics.batchCompleted = Math.min(
      Math.ceil(stress.progress / batchSize),
      metrics.batchTotal,
    );
  } else if (!stress.active && stress.total > 0) {
    const batchSize = 500;
    metrics.batchTotal = Math.ceil(stress.total / batchSize);
    metrics.batchCompleted = metrics.batchTotal;
  }
}

async function measureEdgeRtt(): Promise<void> {
  try {
    const t0 = performance.now();
    await fetch('/api/graphql', { method: 'HEAD', cache: 'no-store' });
    metrics.edgeRttMs = Math.round(performance.now() - t0);
  } catch {
    // Keep last known value on failure
  }
}

function tick(now: number): void {
  measureJitter(now);
  syncWasmMetrics();
  if (running) {
    rafId = requestAnimationFrame(tick);
  }
}

export function startHUDTelemetry(): void {
  if (running) return;
  running = true;
  lastFrameTime = 0;
  rafId = requestAnimationFrame(tick);

  // Measure edge RTT immediately then every 5s
  measureEdgeRtt();
  rttIntervalId = setInterval(measureEdgeRtt, 5_000);
}

export function stopHUDTelemetry(): void {
  running = false;
  cancelAnimationFrame(rafId);
  if (rttIntervalId !== null) {
    clearInterval(rttIntervalId);
    rttIntervalId = null;
  }
}

export function getHUDMetrics(): HUDMetrics {
  return metrics;
}
