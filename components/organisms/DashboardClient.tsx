'use client';

import { useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSimulation } from '../../lib/SimulationContext';
import { useReportData } from '../../lib/ReportDataContext';
import { useStressTestRegistry } from '../providers/StressTestRegistryProvider';
import { simulatePrice } from '../../lib/pricingEngine';
import { runPricingBatch } from '../../lib/runPricingBatch';
import { PricingStatus } from '../molecules/PricingStatus';
import { BigNumberMetric } from '../molecules/BigNumberMetric';
import { EdgeMap } from '../molecules/EdgeMap';
import { WasmThroughputChart } from '../molecules/WasmThroughputChart';
import { SuccessMetricsCards } from '../molecules/SuccessMetricsCards';

interface BaseProduct {
  id: string;
  price: number;
  stock: number;
  name?: string;
}

interface DashboardClientProps {
  initialProducts: BaseProduct[];
}

export default function DashboardClient({ initialProducts }: DashboardClientProps) {
  const searchParams = useSearchParams();
  const debugEnabled = searchParams.get('debug') === 'true';
  const { simulatedHour } = useSimulation();
  const { setReportData, chartContainerRef } = useReportData();
  const { setProducts: setStressTestProducts } = useStressTestRegistry();

  useEffect(() => {
    setStressTestProducts(initialProducts, simulatedHour);
  }, [initialProducts, simulatedHour, setStressTestProducts]);

  // Run the pricing engine locally on all 1,000 products instantly.
  // When ?debug=true, use batched runner and report to WasmTelemetry for the Debug Console.
  const computedData = useMemo(() => {
    if (debugEnabled) {
      return runPricingBatch(initialProducts, simulatedHour, true);
    }

    let totalSavings = 0;
    let peakDemandCount = 0;
    let sustainableSurplusCount = 0;
    let neutralCount = 0;
    let totalLatency = 0;

    const nodes = initialProducts.map(p => {
      const { live_price, agent_confidence } = simulatePrice(
        p.id,
        p.price,
        p.stock,
        simulatedHour
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

      return {
        id: p.id,
        name: p.name ?? `Product ${p.id.slice(0, 8)}`,
        basePrice: p.price,
        livePrice: live_price,
        confidence: agent_confidence,
        volatility: live_price / p.price,
      };
    });

    const averageLatency = totalLatency / initialProducts.length;

    return {
      nodes,
      totalSavings,
      peakDemandCount,
      sustainableSurplusCount,
      neutralCount,
      averageLatency
    };
  }, [initialProducts, simulatedHour, debugEnabled]);

  useEffect(() => {
    setReportData({
      totalSavings: computedData.totalSavings,
      averageLatency: computedData.averageLatency,
      peakDemandCount: computedData.peakDemandCount,
      sustainableSurplusCount: computedData.sustainableSurplusCount,
      neutralCount: computedData.neutralCount,
    });
    return () => setReportData(null);
  }, [computedData, setReportData]);

  return (
    <div className="space-y-8">
      {/* Time Controls */}
      <PricingStatus />

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BigNumberMetric value={computedData.totalSavings} />
        </div>
        <div className="flex flex-col gap-6">
          <SuccessMetricsCards surplusCount={computedData.sustainableSurplusCount} />
        </div>
      </div>

      {/* Visualizations Floor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 flex flex-col">
           <h3 className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-4 shrink-0">Network Edge Map</h3>
           <div className="flex-1 overflow-hidden">
             <EdgeMap nodes={computedData.nodes} />
           </div>
        </div>
        <div
          ref={chartContainerRef}
          className="h-96 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 flex flex-col"
        >
           <h3 className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-4 shrink-0">Wasm Execution Latency Simulation</h3>
           <div className="flex-1 overflow-hidden">
             <WasmThroughputChart averageLatency={computedData.averageLatency} />
           </div>
        </div>
      </div>
    </div>
  );
}
