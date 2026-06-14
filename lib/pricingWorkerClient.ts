import { WasmTelemetry } from './wasmTelemetry';
import { SimulatedPricing } from './pricingEngine';
import { RunPricingBatchResult } from './runPricingBatch';

interface BaseProduct {
  id: string;
  price: number;
  stock: number;
  name?: string;
}

class PricingWorkerClient {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, { resolve: (val: unknown) => void; reject: (err: unknown) => void }> = new Map();
  private messageIdCounter = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker(new URL('./workers/pricing.worker.ts', import.meta.url));
      this.worker.onmessage = this.handleMessage.bind(this);
    }
  }

  private handleMessage(e: MessageEvent) {
    const { id, type, result, logs, error } = e.data;
    const req = this.pendingRequests.get(id);
    if (!req) return;

    this.pendingRequests.delete(id);

    if (type === 'SUCCESS') {
      if (logs && Array.isArray(logs)) {
        logs.forEach(log => {
          // Worker created id and timestamp, we just push it directly? 
          // WasmTelemetry.pushEntry doesn't take id/timestamp, it creates them.
          // But that's fine, we just push the core payload.
          if (log.id !== 'sys-init') {
            WasmTelemetry.pushEntry({
              batchSize: log.batchSize,
              executionTimeMs: log.executionTimeMs,
              seedHex: log.seedHex,
              memoryMb: log.memoryMb,
              message: log.message
            });
          }
        });
      }
      req.resolve(result);
    } else {
      req.reject(new Error(error || 'Worker error'));
    }
  }

  private dispatch<T>(type: string, payload: unknown, timeoutMs: number = 3000): Promise<T> {
    if (!this.worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    const id = `req-${this.messageIdCounter++}`;
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Worker request ${type} timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.pendingRequests.set(id, {
        resolve: (val) => {
          clearTimeout(timeoutId);
          resolve(val as T);
        },
        reject: (err) => {
          clearTimeout(timeoutId);
          reject(err);
        }
      });

      this.worker!.postMessage({ id, type, payload });
    });
  }

  simulatePriceAsync(productId: string, basePrice: number, stock: number, simulatedHour: number | null): Promise<SimulatedPricing> {
    return this.dispatch('SIMULATE_PRICE', { productId, basePrice, stock, simulatedHour });
  }

  simulateBatchAsync(products: BaseProduct[], simulatedHour: number | null, reportToTelemetry: boolean): Promise<RunPricingBatchResult> {
    // 5 seconds timeout for batch
    return this.dispatch('SIMULATE_BATCH', { products, simulatedHour, reportToTelemetry }, 5000);
  }

  simulateBenchmarkAsync(batchSize: number): Promise<{ executionTimeMs: number }> {
    return this.dispatch('SIMULATE_BENCHMARK', { batchSize }, 10000); // larger timeout for bench
  }
}

export const pricingWorkerClient = new PricingWorkerClient();
