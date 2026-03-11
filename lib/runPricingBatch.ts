/**
 * Batch runner for the pricing engine: processes products in chunks of 20,
 * measures execution time, and optionally reports to WasmTelemetry.
 */

import { simulatePrice, getSeedHex } from './pricingEngine';
import { WasmTelemetry, captureMemoryMb } from './wasmTelemetry';

const BATCH_SIZE = 20;

export interface PricingNode {
  id: string;
  name: string;
  basePrice: number;
  livePrice: number;
  confidence: number;
  volatility: number;
}

interface BaseProduct {
  id: string;
  price: number;
  stock: number;
  name?: string;
}

export interface RunPricingBatchResult {
  nodes: PricingNode[];
  totalSavings: number;
  peakDemandCount: number;
  sustainableSurplusCount: number;
  neutralCount: number;
  averageLatency: number;
}

export function runPricingBatch(
  products: BaseProduct[],
  simulatedHour: number | null,
  reportToTelemetry: boolean,
): RunPricingBatchResult {
  const nodes: PricingNode[] = [];
  let totalSavings = 0;
  let peakDemandCount = 0;
  let sustainableSurplusCount = 0;
  let neutralCount = 0;
  let totalLatency = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const chunk = products.slice(i, i + BATCH_SIZE);
    const t0 = performance.now();

    for (const p of chunk) {
      const { live_price, agent_confidence } = simulatePrice(
        p.id,
        p.price,
        p.stock,
        simulatedHour,
      );

      const savings = p.price - live_price;
      totalSavings += savings;

      if (live_price > p.price) {
        peakDemandCount++;
      } else if (live_price < p.price) {
        sustainableSurplusCount++;
      } else {
        neutralCount++;
      }

      const simulatedLatency = 0.6 + (Math.random() * 0.4);
      totalLatency += simulatedLatency;

      nodes.push({
        id: p.id,
        name: p.name ?? `Product ${p.id.slice(0, 8)}`,
        basePrice: p.price,
        livePrice: live_price,
        confidence: agent_confidence,
        volatility: live_price / p.price,
      });
    }

    const executionTimeMs = performance.now() - t0;

    if (reportToTelemetry && chunk.length > 0) {
      const seedHex = getSeedHex(chunk[0].id, simulatedHour);
      const memoryMb = captureMemoryMb();
      WasmTelemetry.pushEntry({
        batchSize: chunk.length,
        executionTimeMs,
        seedHex,
        memoryMb,
      });
    }
  }

  const averageLatency = products.length > 0 ? totalLatency / products.length : 0;

  return {
    nodes,
    totalSavings,
    peakDemandCount,
    sustainableSurplusCount,
    neutralCount,
    averageLatency,
  };
}
