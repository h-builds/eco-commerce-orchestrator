"use client";

import { useMemo, useEffect } from "react";
import Link from "next/link";
import { useSimulation } from "../../lib/SimulationContext";
import { useReportData } from "../../lib/ReportDataContext";
import { useStressTestRegistry } from "../providers/StressTestRegistryProvider";
import { runPricingBatch } from "../../lib/runPricingBatch";
import { PricingStatus } from "../molecules/PricingStatus";
import { BigNumberMetric } from "../molecules/BigNumberMetric";
import { EdgeMap } from "../molecules/EdgeMap";
import { WasmThroughputChart } from "../molecules/WasmThroughputChart";
import { SuccessMetricsCards } from "../molecules/SuccessMetricsCards";
import { getEfficiencyForHour } from "../../lib/efficiencyScore";

interface BaseProduct {
  id: string;
  price: number;
  stock: number;
  name?: string;
}

interface DashboardClientProps {
  initialProducts: BaseProduct[];
}

export default function DashboardClient({
  initialProducts,
}: DashboardClientProps) {
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
            efficiencyScore={getEfficiencyForHour(
              simulatedHour !== null ? simulatedHour : new Date().getHours(),
            )}
          />
          <Link
            href="/benchmarks"
            className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-cyan-500/30 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-500">
                System Audit
              </span>
              <span className="text-lg font-black text-white">
                Run Live Performance Duel
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                arrow_forward
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Visualizations Floor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 flex flex-col">
          <h3 className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-4 shrink-0">
            Network Edge Map
          </h3>
          <div className="flex-1 overflow-hidden">
            <EdgeMap nodes={computedData.nodes} />
          </div>
        </div>
        <div
          ref={chartContainerRef}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 flex flex-col">
          <h3 className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-4 shrink-0">
            Wasm Execution Latency Simulation
          </h3>
          <div className="flex-1 overflow-hidden">
            <WasmThroughputChart averageLatency={computedData.averageLatency} />
          </div>
        </div>
      </div>
    </div>
  );
}
