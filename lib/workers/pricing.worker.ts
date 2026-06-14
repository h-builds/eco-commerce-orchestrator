import { simulatePrice } from '../pricingEngine';
import { runPricingBatch } from '../runPricingBatch';
import { WasmTelemetry } from '../wasmTelemetry';

self.onmessage = (e: MessageEvent) => {
  const { id, type, payload } = e.data;

  try {
    if (type === 'SIMULATE_PRICE') {
      const { productId, basePrice, stock, simulatedHour } = payload;
      const result = simulatePrice(productId, basePrice, stock, simulatedHour);
      self.postMessage({ id, type: 'SUCCESS', result });
    } else if (type === 'SIMULATE_BATCH') {
      const { products, simulatedHour, reportToTelemetry } = payload;
      
      WasmTelemetry.clear();
      const result = runPricingBatch(products, simulatedHour, reportToTelemetry);
      const logs = WasmTelemetry.getLogs();
      
      self.postMessage({ id, type: 'SUCCESS', result, logs });
    } else if (type === 'SIMULATE_BENCHMARK') {
      const { batchSize } = payload;
      const start = performance.now();
      for (let i = 0; i < batchSize; i++) {
        simulatePrice(`bench-prod-${i}`, 100.0, 50, null);
      }
      const executionTimeMs = performance.now() - start;
      self.postMessage({ id, type: 'SUCCESS', result: { executionTimeMs } });
    } else {
      self.postMessage({ id, type: 'ERROR', error: `Unknown message type: ${type}` });
    }
  } catch (error) {
    self.postMessage({
      id,
      type: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
