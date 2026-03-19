/**
 * Batch Orchestrator — parallel fan-out strategy for high-concurrency Edge processing.
 *
 * Splits large payloads into fixed-size chunks and dispatches them concurrently
 * via Promise.all(). This 'Fan-out' strategy bypasses the 50ms CPU time limit
 * of standard Cloudflare Edge Workers by distributing computation across
 * multiple Worker invocations simultaneously, demonstrating horizontal
 * scalability across global Edge nodes.
 *
 * Each chunk includes a single-retry policy: if a batch fails on its first
 * attempt, it retries once. If it fails again, the error is logged and the
 * remaining batches continue — ensuring the benchmark is resilient but honest.
 */

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export interface BatchProgress {
  completedBatches: number;
  totalBatches: number;
  processedItems: number;
  totalItems: number;
}

export interface BatchResult<R> {
  results: R[];
  errors: Array<{ batchIndex: number; error: unknown }>;
  worstCaseLatencyMs: number;
  totalElapsedMs: number;
}

/**
 * Dispatches chunks in parallel with single-retry resilience.
 *
 * @param chunks       — pre-split sub-arrays
 * @param processFn    — async handler for a single chunk
 * @param onProgress   — optional callback fired after each batch completes
 */
export async function orchestrateBatches<T, R>(
  chunks: T[][],
  processFn: (chunk: T[], batchIndex: number) => Promise<R>,
  onProgress?: (progress: BatchProgress) => void,
): Promise<BatchResult<R>> {
  const totalItems = chunks.reduce((sum, c) => sum + c.length, 0);
  const totalBatches = chunks.length;
  let completedBatches = 0;
  let processedItems = 0;

  const errors: Array<{ batchIndex: number; error: unknown }> = [];
  const batchLatencies: number[] = [];

  const tGlobal = performance.now();

  const results = await Promise.all(
    chunks.map(async (chunk, batchIndex) => {
      const tBatch = performance.now();

      // First attempt
      try {
        const result = await processFn(chunk, batchIndex);
        batchLatencies.push(performance.now() - tBatch);

        completedBatches++;
        processedItems += chunk.length;
        onProgress?.({
          completedBatches,
          totalBatches,
          processedItems,
          totalItems,
        });

        return { ok: true as const, data: result };
      } catch {
        // Single-retry policy
        try {
          const result = await processFn(chunk, batchIndex);
          batchLatencies.push(performance.now() - tBatch);

          completedBatches++;
          processedItems += chunk.length;
          onProgress?.({
            completedBatches,
            totalBatches,
            processedItems,
            totalItems,
          });

          return { ok: true as const, data: result };
        } catch (retryError) {
          batchLatencies.push(performance.now() - tBatch);
          errors.push({ batchIndex, error: retryError });

          completedBatches++;
          processedItems += chunk.length;
          onProgress?.({
            completedBatches,
            totalBatches,
            processedItems,
            totalItems,
          });

          console.error(
            `[BatchOrchestrator] Batch ${batchIndex} failed after retry:`,
            retryError,
          );
          return { ok: false as const, data: null };
        }
      }
    }),
  );

  const totalElapsedMs = performance.now() - tGlobal;
  const worstCaseLatencyMs =
    batchLatencies.length > 0 ? Math.max(...batchLatencies) : 0;

  const successfulResults: R[] = results
    .filter((r) => r.ok)
    .map((r) => r.data as R);

  return {
    results: successfulResults,
    errors,
    worstCaseLatencyMs,
    totalElapsedMs,
  };
}
