"use client";

import { useState, useTransition, use, useMemo } from "react";

interface PredictivePriceAlertProps {
  currentPrice: number;
  dataPromise: Promise<{ hour: number; price: number; confidence: number }[]>;
}

/**
 * Orchestrates real-time price forecasting by scanning deterministic
 * Edge-seed vectors. Leverages React 19 `use()` for asynchronous
 * promise unwrapping to synchronize predictive UI states with
 * distributed volatility data.
 */
export function PredictivePriceAlert({
  currentPrice,
  dataPromise,
}: PredictivePriceAlertProps) {
  const data = use(dataPromise);

  const defaultTarget = useMemo(() => {
    return Math.floor(currentPrice * 0.95 * 100) / 100;
  }, [currentPrice]);

  const [targetPrice, setTargetPrice] = useState<number>(defaultTarget);
  const [isPending, startTransition] = useTransition();
  const [scanResult, setScanResult] = useState<{
    found: boolean;
    hour?: number;
    message: string;
  } | null>(null);

  const bestTime = useMemo(() => {
    if (!data || data.length === 0) return null;
    let lowest = data[0];
    for (let i = 1; i < data.length; i++) {
      if (data[i].price < lowest.price) lowest = data[i];
    }
    return lowest;
  }, [data]);

  const handleScan = () => {
    startTransition(() => {
      setTimeout(() => {
        const match = data.find(
          (d: { price: number }) => d.price <= targetPrice,
        );

        if (match) {
          setScanResult({
            found: true,
            hour: match.hour,
            message: `Success! Target reached at ${match.hour.toString().padStart(2, "0")}:00 UTC. We'll trigger a notification then.`,
          });
        } else {
          setScanResult({
            found: false,
            message: `Target not met in the next 24h. Try a slightly higher price. Minimum projected is $${bestTime?.price.toFixed(2)}.`,
          });
        }
      }, 600);
    });
  };

  const handleQuickSet = (percentage: number) => {
    setTargetPrice(Math.floor(currentPrice * (1 - percentage) * 100) / 100);
    setScanResult(null);
  };

  return (
    <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors duration-700 pointer-events-none" />

      {isPending && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center border-2 border-amber-500 rounded-2xl animate-pulse">
          <span
            className="material-symbols-outlined notranslate text-4xl text-amber-500 animate-spin mb-2"
            style={{ animationDuration: "2s" }}
            aria-hidden="true" translate="no">
            radar
          </span>
          <span className="text-amber-500 font-mono text-xs font-bold tracking-widest uppercase animate-pulse">
            Analyzing Edge-Seed projections...
          </span>
        </div>
      )}

      <div className="flex justify-between items-start mb-6 relative z-0">
        <div>
          <h3 className="text-amber-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-1">
            <span
              className="material-symbols-outlined notranslate text-sm"
              aria-hidden="true" translate="no">
              notifications_active
            </span>
            Predictive Price Alert
          </h3>
          <p className="text-slate-400 text-sm">
            Set your target price. The Orchestrator will scan tomorrow&apos;s
            deterministic vectors.
          </p>
        </div>

        {bestTime && (
          <div className="text-right shrink-0 ml-4 hidden sm:block">
            <div className="inline-flex flex-col items-end bg-slate-800/50 border border-slate-700/50 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Best Time To Buy
              </span>
              <span className="text-emerald-400 font-mono font-bold text-sm">
                ${bestTime.price.toFixed(2)} @{" "}
                {bestTime.hour.toString().padStart(2, "0")}:00 UTC
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-end gap-4 relative z-0">
        <div className="w-full sm:w-1/2">
          <label
            htmlFor="target-price"
            className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
            Target Price ($)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              $
            </span>
            <input
              id="target-price"
              type="number"
              step="0.01"
              value={targetPrice}
              onChange={(e) => {
                setTargetPrice(parseFloat(e.target.value));
                setScanResult(null);
              }}
              className="w-full bg-slate-800 border-2 border-slate-700 text-white font-mono font-bold text-lg rounded-xl py-3 pl-8 pr-4 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <div className="w-full sm:w-1/2 flex gap-2 sm:pb-3">
          <button
            onClick={() => handleQuickSet(0.05)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg py-2 text-xs font-bold transition-colors">
            -5%
          </button>
          <button
            onClick={() => handleQuickSet(0.1)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg py-2 text-xs font-bold transition-colors">
            -10%
          </button>
          <button
            onClick={() => handleQuickSet(0.2)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg py-2 text-xs font-bold transition-colors">
            -20%
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-0">
        <button
          onClick={handleScan}
          disabled={
            isPending ||
            targetPrice >= currentPrice ||
            targetPrice <= 0 ||
            isNaN(targetPrice)
          }
          className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black tracking-widest uppercase text-sm rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
          <span
            className="material-symbols-outlined notranslate text-sm text-slate-900 font-bold"
            aria-hidden="true" translate="no">
            radar
          </span>
          Scan Forecast
        </button>

        <div className="flex-1 w-full sm:w-auto h-12 flex items-center justify-end">
          {scanResult && (
            <div
              className={`text-sm font-semibold flex items-center gap-2 ${scanResult.found ? "text-emerald-400" : "text-rose-400"}`}>
              <span
                className="material-symbols-outlined notranslate text-lg"
                aria-hidden="true" translate="no">
                {scanResult.found ? "check_circle" : "error"}
              </span>
              {scanResult.message}
            </div>
          )}
          {!scanResult && !isPending && (
            <span className="text-xs text-slate-500 font-mono italic">
              Waiting for target input...
            </span>
          )}
        </div>
      </div>

      {bestTime && (
        <div className="mt-4 sm:hidden bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Best Time To Buy
          </span>
          <span className="text-emerald-400 font-mono font-bold text-sm">
            ${bestTime.price.toFixed(2)} @{" "}
            {bestTime.hour.toString().padStart(2, "0")}:00 UTC
          </span>
        </div>
      )}
    </div>
  );
}
