'use client';

import { useMemo } from 'react';
import { useSimulation } from '../../lib/SimulationContext';
import { simulatePrice } from '../../lib/pricingEngine';
import { PricingStatus } from '../molecules/PricingStatus';
import { BigNumberMetric } from '../molecules/BigNumberMetric';
import { EdgeMap } from '../molecules/EdgeMap';
import { WasmThroughputChart } from '../molecules/WasmThroughputChart';
import { SuccessMetricsCards } from '../molecules/SuccessMetricsCards';

interface BaseProduct {
  id: string;
  price: number;
  stock: number;
}

interface DashboardClientProps {
  initialProducts: BaseProduct[];
}

export default function DashboardClient({ initialProducts }: DashboardClientProps) {
  const { simulatedHour } = useSimulation();

  // Run the pricing engine locally on all 1,000 products instantly
  const computedData = useMemo(() => {
    let totalSavings = 0;
    let peakDemandCount = 0;
    let sustainableSurplusCount = 0;
    let neutralCount = 0;
    let totalLatency = 0;

    const nodes = initialProducts.map(p => {
      // simulatePrice is pure and very fast. We can run it 1,000 times comfortably.
      const { live_price, agent_confidence } = simulatePrice(
        p.id,
        p.price,
        p.stock,
        simulatedHour
      );

      const savings = p.price - live_price;
      totalSavings += savings;

      // Classify
      if (live_price > p.price) {
        peakDemandCount++;
      } else if (live_price < p.price) {
        sustainableSurplusCount++;
      } else {
        neutralCount++;
      }

      // We'll simulate latency hovering around 0.8ms
      const simulatedLatency = 0.6 + (Math.random() * 0.4);
      totalLatency += simulatedLatency;

      return {
        id: p.id,
        basePrice: p.price,
        livePrice: live_price,
        confidence: agent_confidence,
        volatility: live_price / p.price, // ratio
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
  }, [initialProducts, simulatedHour]);

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
        <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 flex flex-col">
           <h3 className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-4 shrink-0">Wasm Execution Latency Simulation</h3>
           <div className="flex-1 overflow-hidden">
             <WasmThroughputChart averageLatency={computedData.averageLatency} />
           </div>
        </div>
      </div>
    </div>
  );
}
