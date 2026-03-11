/**
 * System Stress Test: forces fresh re-calculation of all products and streams
 * every batch to WasmTelemetry for Debug Console observation.
 */

import { simulatePrice, getSeedHex } from './pricingEngine';
import { WasmTelemetry, captureMemoryMb } from './wasmTelemetry';

const STRESS_BATCH_SIZE = 20;

interface BaseProduct {
  id: string;
  price: number;
  stock: number;
  name?: string;
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * Re-calculates pricing for every item in the dataset with no cache.
 * Logs each batch to WasmTelemetry and updates stress test progress.
 * Yields between chunks so the UI stays responsive.
 */
export async function triggerGlobalRevaluation(
  products: BaseProduct[],
  simulatedHour: number | null,
): Promise<void> {
  const total = products.length;
  WasmTelemetry.setStressTestStatus({
    active: true,
    progress: 0,
    total,
    summary: null,
  });

  const tStart = performance.now();
  let processed = 0;

  for (let i = 0; i < products.length; i += STRESS_BATCH_SIZE) {
    const chunk = products.slice(i, i + STRESS_BATCH_SIZE);
    const t0 = performance.now();

    for (const p of chunk) {
      simulatePrice(p.id, p.price, p.stock, simulatedHour);
    }

    const executionTimeMs = performance.now() - t0;
    processed += chunk.length;

    const seedHex = chunk.length > 0 ? getSeedHex(chunk[0].id, simulatedHour) : undefined;
    const memoryMb = captureMemoryMb();
    WasmTelemetry.pushEntry({
      batchSize: chunk.length,
      executionTimeMs,
      seedHex,
      memoryMb,
    });

    WasmTelemetry.setStressTestStatus({
      active: true,
      progress: processed,
      total,
      summary: null,
    });

    await yieldToMain();
  }

  const totalMs = performance.now() - tStart;
  const avgLatencyUs = total > 0 ? (totalMs * 1000) / total : 0;
  const summary = `Stress Test Complete: ${total.toLocaleString()} items processed in ${totalMs.toFixed(2)}ms | Avg Latency: ${avgLatencyUs.toFixed(2)}μs`;

  WasmTelemetry.setStressTestStatus({
    active: false,
    progress: total,
    total,
    summary,
  });
}
