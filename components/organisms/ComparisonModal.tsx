"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompare } from "@/lib/CompareContext";
import { useSimulation } from "@/lib/SimulationContext";
import { ComparisonChart } from "@/components/molecules/ComparisonChart";
import { getVolatilityData } from "@/lib/pricing";
import type { Product } from "@/components/molecules/ProductCard";

// Pearson correlation coefficient
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function ComparisonModal() {
  const { selectedProducts, isCompareModalOpen, setIsCompareModalOpen } = useCompare();
  const { simulatedHour } = useSimulation();
  
  const [chartData, setChartData] = useState<Array<Record<string, number>>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derive the active hour
  const currentHour = new Date().getHours();
  const activeHour = simulatedHour !== null ? simulatedHour : currentHour;

  useEffect(() => {
    if (!isCompareModalOpen) return;

    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      // Fetch data for all selected products concurrently
      const promises = selectedProducts.map(p => 
        getVolatilityData(p.id, p.price, p.stock)
      );

      try {
        const results = await Promise.all(promises);
        
        if (!isMounted) return;

        // Merge results into a single array for Recharts
        // Format: [{ hour: 0, p1_id: 10, p2_id: 15 }, ...]
        const mergedData = Array.from({ length: 24 }).map((_, hourIndex) => {
          const point: Record<string, number> = { hour: hourIndex };
          selectedProducts.forEach((p, pIndex) => {
            const productData = results[pIndex];
            point[p.id] = productData[hourIndex].price;
          });
          return point;
        });

        setChartData(mergedData);
      } catch (e) {
        console.error("Failed to load comparison data", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isCompareModalOpen, selectedProducts]);

  // Calculate Best Value for the active hour
  const bestValueProduct = useMemo<{ product: Product; price: number; id: string } | null>(() => {
    if (chartData.length === 0 || selectedProducts.length === 0) return null;
    
    // Find the row for the active hour
    const activeData = chartData.find(d => d.hour === activeHour);
    if (!activeData) return null;

    let lowestPrice = Infinity;
    let bestProduct: Product | null = null;
    let bestId = "";

    selectedProducts.forEach((p) => {
      const priceAtHour = activeData[p.id];
      if (typeof priceAtHour === 'number' && priceAtHour < lowestPrice) {
        lowestPrice = priceAtHour;
        bestProduct = p;
        bestId = p.id;
      }
    });

    if (!bestProduct) return null;

    return { product: bestProduct, price: lowestPrice, id: bestId };
  }, [chartData, activeHour, selectedProducts]);

  // Calculate Correlation Index (only meaningful if exactly 2 products)
  const correlationIndex = useMemo(() => {
    if (selectedProducts.length !== 2 || chartData.length === 0) return null;
    
    const p1 = selectedProducts[0].id;
    const p2 = selectedProducts[1].id;

    const prices1 = chartData.map(d => d[p1]);
    const prices2 = chartData.map(d => d[p2]);

    const corr = calculateCorrelation(prices1, prices2);
    return corr;
  }, [chartData, selectedProducts]);

  if (!isCompareModalOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-emerald-500/10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500" aria-hidden="true">analytics</span>
                Product Comparison
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                24-Hour Deterministic Edge Pricing Trajectories
              </p>
            </div>
            <button
              onClick={() => setIsCompareModalOpen(false)}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Close comparison modal"
            >
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex-1 flex flex-col gap-8">
            {isLoading ? (
              <div className="h-[400px] w-full flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            ) : (
              <>
                {/* The Chart */}
                <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 relative">
                    <ComparisonChart products={selectedProducts} chartData={chartData} />
                </div>

                {/* Info Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Best Value Summary */}
                  <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 flex flex-col justify-center">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Best Value @ {activeHour % 12 || 12}:00 {activeHour >= 12 ? 'PM' : 'AM'}
                    </h3>
                    {bestValueProduct && bestValueProduct.product ? (
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-black text-emerald-400">
                          ${bestValueProduct.price.toFixed(2)}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold text-lg line-clamp-1">
                            {bestValueProduct.product.name}
                          </p>
                          <p className="text-sm text-slate-400 line-clamp-1">
                            {bestValueProduct.product.category}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 italic">No data</div>
                    )}
                  </div>

                  {/* Correlation Index Card */}
                  {correlationIndex !== null ? (
                     <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 flex flex-col justify-center">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                         Correlation Index 
                         <span className="material-symbols-outlined text-xs" title="Pearson correlation coefficient" aria-hidden="true">info</span>
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className={`text-4xl font-black ${correlationIndex > 0.5 ? 'text-blue-400' : correlationIndex < -0.5 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {correlationIndex.toFixed(2)}
                        </div>
                        <div className="flex-1">
                           <p className="text-white text-sm">
                             {correlationIndex > 0.8 ? "Highly Correlated" : 
                              correlationIndex > 0.3 ? "Moderately Correlated" :
                              correlationIndex > -0.3 ? "Uncorrelated" :
                              correlationIndex > -0.8 ? "Moderately Inversely Correlated" :
                              "Highly Inversely Correlated"}
                           </p>
                           <p className="text-xs text-slate-400 mt-1 leading-tight">
                             {correlationIndex > 0 
                               ? "Prices move together. Substituting might not yield large savings." 
                               : "Prices move in opposite directions. Great opportunity to buy the cheaper one."}
                           </p>
                        </div>
                      </div>
                     </div>
                  ) : selectedProducts.length > 2 ? (
                      <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 flex flex-col justify-center text-center">
                        <span className="material-symbols-outlined text-slate-500 text-3xl mb-2" aria-hidden="true">ssid_chart</span>
                        <p className="text-slate-400 text-sm">Correlation index requires exactly 2 products.</p>
                      </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
