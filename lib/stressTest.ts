/**
 * System Stress Test — High-Concurrency Parallel Batching
 *
 * 'Fan-out' strategy: splits the 10,000-item payload into parallel batches
 * of 500 items. This bypasses the 50ms CPU time limit of standard Cloudflare
 * Edge Workers by distributing computation across multiple concurrent
 * invocations, demonstrating horizontal scalability across global Edge nodes.
 *
 * Each batch includes a single-retry policy: if processing fails on the first
 * attempt, it retries once. If it fails again, the error is logged but the
 * remaining batches continue — ensuring the benchmark is resilient but honest.
 */

import { getSeedHex } from './pricingEngine';
import { batchLivePrices } from './pricing';
import { WasmTelemetry, captureMemoryMb } from './wasmTelemetry';
import { chunkArray, orchestrateBatches } from './batchOrchestrator';

const EDGE_BATCH_SIZE = 500;

interface BaseProduct {
  id: string;
  price: number;
  stock: number;
  name?: string;
}


/**
 * Processes a single 500-item batch: runs the pricing simulation for every
 * product and pushes telemetry. Returns the count of processed items.
 */
async function processBatch(
  products: BaseProduct[],
  simulatedHour: number | null,
): Promise<number> {
  const t0 = performance.now();

  // Dispatch the entire 500-item batch across the network to the
  // Edge Worker Service Binding to force Fan-out execution
  await batchLivePrices(products.map(p => ({
    id: p.id,
    price: p.price,
    stock: p.stock
  })));

  const executionTimeMs = performance.now() - t0;
  const seedHex = products.length > 0 ? getSeedHex(products[0].id, simulatedHour) : undefined;
  const memoryMb = captureMemoryMb();

  WasmTelemetry.pushEntry({
    batchSize: products.length,
    executionTimeMs,
    seedHex,
    memoryMb,
  });

  return products.length;
}

/**
 * Re-calculates pricing for every item in the dataset with no cache.
 * Uses parallel fan-out across 500-item batches via Promise.all().
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
  const chunks = chunkArray(products, EDGE_BATCH_SIZE);

  const result = await orchestrateBatches(
    chunks,
    async (chunk) => {
      // Yield to main thread before processing to allow UI paint
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      return processBatch(chunk, simulatedHour);
    },
    (progress) => {
      WasmTelemetry.setStressTestStatus({
        active: true,
        progress: progress.processedItems,
        total,
        summary: null,
      });
    },
  );

  const totalMs = performance.now() - tStart;
  const processedCount = result.results.reduce((sum, n) => sum + n, 0);
  const avgLatencyUs = processedCount > 0 ? (totalMs * 1000) / processedCount : 0;

  const failedBatches = result.errors.length;
  const failNote = failedBatches > 0
    ? ` | ${failedBatches} batch(es) failed after retry`
    : '';

  const summary = [
    `Stress Test Complete: ${processedCount.toLocaleString()} items processed in ${totalMs.toFixed(2)}ms`,
    `Avg Latency: ${avgLatencyUs.toFixed(2)}μs`,
    `Fan-out: ${chunks.length} batches × ${EDGE_BATCH_SIZE} items`,
    `Worst-Case Batch: ${result.worstCaseLatencyMs.toFixed(2)}ms`,
    failNote,
  ].filter(Boolean).join(' | ');

  WasmTelemetry.setStressTestStatus({
    active: false,
    progress: total,
    total,
    summary,
  });
}
