'use client';

import { useEffect, useRef } from 'react';
import { WasmTelemetry, captureMemoryMb } from '@/lib/wasmTelemetry';
import { getSeedHex } from '@/lib/pricingEngine';

interface SingleProductTelemetryProps {
  productId: string;
  latencyMs: number;
}

export function SingleProductTelemetry({ productId, latencyMs }: SingleProductTelemetryProps) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    WasmTelemetry.pushEntry({
      batchSize: 1,
      executionTimeMs: latencyMs,
      seedHex: getSeedHex(productId, null),
      memoryMb: captureMemoryMb(),
    });
  }, [productId, latencyMs]);

  return null;
}
