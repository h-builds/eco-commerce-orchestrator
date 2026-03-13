"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Fetcher } from "@cloudflare/workers-types";
import { simulatePrice } from "./pricingEngine";

export interface BenchmarkResult {
  executionTimeMs: number;
  internalExecTimeUs?: number;
  error?: string;
}

function generateMockData(size: number) {
  const data = [];
  for (let i = 0; i < size; i++) {
    data.push({
      product_id: `bench-prod-${i}`,
      base_price: 100.0,
      stock: 50,
    });
  }
  return data;
}

/**
 * Measures local V8 execution performance to establish a baseline for 
 * JIT-optimized JavaScript logic. Complements Edge Wasm benchmarks to 
 * quantify deterministic compute offsets.
 */
export async function runJSBenchmarkChunk(chunkSize: number): Promise<BenchmarkResult> {
  const mockData = generateMockData(chunkSize);
  
  const start = performance.now();
  for (const item of mockData) {
    simulatePrice(item.product_id, item.base_price, item.stock, null);
  }
  const end = performance.now();
  
  return { executionTimeMs: end - start };
}

/**
 * Evaluates Go-Wasm pricing agent throughput via Cloudflare Service Bindings. 
 * Account for Spectre mitigation-induced timer freezing by deducing pure 
 * compute time from baseline network round-trip subtractions.
 */
export async function runWasmBenchmarkChunk(chunkSize: number): Promise<BenchmarkResult> {
  const mockData = generateMockData(chunkSize);
  
  const env = (await getCloudflareContext({ async: true })).env as unknown as {
    PRICING_AGENT?: Fetcher;
    INTERNAL_SECRET?: string;
  };

  if (!env.PRICING_AGENT) {
    return { executionTimeMs: 0, internalExecTimeUs: 0, error: "Wasm Pricing Agent not available (env.PRICING_AGENT is undefined)" };
  }

  const start = performance.now();
  
  let res;
  try {
    res = await env.PRICING_AGENT.fetch("http://pricing-agent/rpc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.INTERNAL_SECRET}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "calculate_price",
        params: mockData,
        id: "benchmark-chunk",
      }),
    });
  } catch (error) {
    console.error("Fetch to PRICING_AGENT failed:", error);
    return { 
      executionTimeMs: 0, 
      internalExecTimeUs: 0, 
      error: `Wasm Agent Service Binding fetch failed: ${error instanceof Error ? error.message : String(error)}` 
    };
  }

  const end = performance.now();

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unable to read error body");
    console.error(`Wasm Agent fetch failed with status ${res.status} ${res.statusText}:`, errorText);
    return { 
      executionTimeMs: 0, 
      internalExecTimeUs: 0, 
      error: `Wasm Agent fetch failed: ${res.statusText} - ${errorText}` 
    };
  }

  let data;
  try {
    data = (await res.json()) as { 
      result?: unknown[];
      internal_exec_time_us?: number;
    };
  } catch (error) {
    console.error("Failed to parse PRICING_AGENT response:", error);
    return { 
      executionTimeMs: 0, 
      internalExecTimeUs: 0, 
      error: `Failed to parse PRICING_AGENT response: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
  
  const pingStart = performance.now();
  try {
    await env.PRICING_AGENT.fetch("http://pricing-agent/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "ping", id: 2 }),
    });
  } catch {
  }
  const pingEnd = performance.now();
  
  const totalMs = end - start;
  const pingMs = pingEnd - pingStart;

  const deducedComputeUs = Math.max(1, (totalMs - pingMs) * 1000);
  const finalInternalUs = (data?.internal_exec_time_us && data.internal_exec_time_us > 0) 
    ? data.internal_exec_time_us 
    : deducedComputeUs;

  return {
    executionTimeMs: totalMs,
    internalExecTimeUs: finalInternalUs,
  };
}
