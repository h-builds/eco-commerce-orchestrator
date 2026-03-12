'use client';

import { useMemo, useEffect } from 'react';
import { useSimulation } from '../../lib/SimulationContext';
import { useReportData } from '../../lib/ReportDataContext';
import { useStressTestRegistry } from '../providers/StressTestRegistryProvider';
import { runPricingBatch } from '../../lib/runPricingBatch';
import { PricingStatus } from '../molecules/PricingStatus';
import { BigNumberMetric } from '../molecules/BigNumberMetric';
import { EdgeMap } from '../molecules/EdgeMap';
import { WasmThroughputChart } from '../molecules/WasmThroughputChart';
import { SuccessMetricsCards } from '../molecules/SuccessMetricsCards';
import { getEfficiencyForHour } from '../../lib/efficiencyScore';

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
  const { simulatedHour } = useSimulation();
  const { setReportData, chartContainerRef } = useReportData();
  const { setProducts: setStressTestProducts } = useStressTestRegistry();

  useEffect(() => {
    setStressTestProducts(initialProducts, simulatedHour);
  }, [initialProducts, simulatedHour, setStressTestProducts]);

  // Run the pricing engine on all products, always reporting to WasmTelemetry
  // so sliders and page loads both stream logs to the Debug Console.
  const computedData = useMemo(() => {
    return runPricingBatch(initialProducts, simulatedHour, true);
  }, [initialProducts, simulatedHour]);

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
          <SuccessMetricsCards 
            surplusCount={computedData.sustainableSurplusCount}
            totalSavings={computedData.totalSavings}
            efficiencyScore={getEfficiencyForHour(simulatedHour !== null ? simulatedHour : new Date().getHours())}
          />
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
