"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { runWasmBenchmarkChunk } from "@/lib/benchmarking";
import { simulatePrice } from "@/lib/pricingEngine";
import { toPng } from "html-to-image";

const TOTAL_ITERATIONS = 10000;
const BATCH_SIZE = 500;
const BATCH_COUNT = TOTAL_ITERATIONS / BATCH_SIZE;

interface MetricData {
  timeMs: number;
  internalTimeUs?: number;
}

/**
 * Contrasts V8 JIT optimization against deterministic Go-Wasm execution to 
 * quantify latency offsets and computational parity under high-concurrency 
 * load (10k iterations).
 */
export default function BenchmarksPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);

  const [jsProgress, setJsProgress] = useState(0);
  const [wasmProgress, setWasmProgress] = useState(0);

  const [jsMetrics, setJsMetrics] = useState<MetricData>({ timeMs: 0 });
  const [wasmMetrics, setWasmMetrics] = useState<MetricData>({
    timeMs: 0,
    internalTimeUs: 0,
  });

  const snapshotRef = useRef<HTMLDivElement>(null);

  const runJSBatchLocally = (batchSize: number): number => {
    const start = performance.now();
    for (let i = 0; i < batchSize; i++) {
      simulatePrice(`bench-prod-${i}`, 100.0, 50, null);
    }
    return performance.now() - start;
  };

  const startBattle = async () => {
    setIsRunning(true);
    setIsFinished(false);
    setBenchmarkError(null);
    setJsProgress(0);
    setWasmProgress(0);
    setJsMetrics({ timeMs: 0 });
    setWasmMetrics({ timeMs: 0, internalTimeUs: 0 });

    let jsTotalMs = 0;

    for (let i = 0; i < BATCH_COUNT; i++) {
      const batchMs = runJSBatchLocally(BATCH_SIZE);
      jsTotalMs += batchMs;
      setJsProgress((prev) => prev + BATCH_SIZE);
      setJsMetrics({ timeMs: jsTotalMs });
      await new Promise((r) => setTimeout(r, 0));
    }

    let wasmTotalMs = 0;
    let wasmInternalTotalUs = 0;

    for (let i = 0; i < BATCH_COUNT; i++) {
      try {
        const res = await runWasmBenchmarkChunk(BATCH_SIZE);
        if (res.error) {
          console.error("Wasm benchmark returned error:", res.error);
          setBenchmarkError(`Wasm benchmark failed: ${res.error}`);
          setIsRunning(false);
          return;
        }

        wasmTotalMs += res.executionTimeMs;
        wasmInternalTotalUs += res.internalExecTimeUs || 0;
        setWasmProgress((prev) => prev + BATCH_SIZE);
        setWasmMetrics({
          timeMs: wasmTotalMs,
          internalTimeUs: wasmInternalTotalUs,
        });
      } catch (err) {
        console.error("Wasm benchmark unexpected error:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setBenchmarkError(`Wasm benchmark unexpected error: ${errorMessage}. Please check the console.`);
        setIsRunning(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 0));
    }

    setIsRunning(false);
    setIsFinished(true);
  };

  const currentWasmOps =
    wasmProgress > 0 && wasmMetrics.timeMs > 0
      ? (wasmProgress / wasmMetrics.timeMs) * 1000
      : 0;
  const currentJsOps =
    jsProgress > 0 && jsMetrics.timeMs > 0
      ? (jsProgress / jsMetrics.timeMs) * 1000
      : 0;

  const finalJsTimeUs = jsMetrics.timeMs * 1000;
  const finalWasmInternalUs = wasmMetrics.internalTimeUs || 0;
  const computeRatio =
    finalJsTimeUs > 0 && finalWasmInternalUs > 0
      ? finalJsTimeUs / finalWasmInternalUs
      : 0;
  const ratioLabel =
    computeRatio === 0
      ? "—"
      : `${computeRatio.toFixed(2)}x`;
  const jsWins = computeRatio > 0 && computeRatio < 1;

  const renderGauge = (
    label: string,
    progress: number,
    timeMs: number,
    ops: number,
    isWasm: boolean,
  ) => {
    const percentage = Math.min(100, (progress / TOTAL_ITERATIONS) * 100);
    const color = isWasm ? "bg-cyan-500" : "bg-yellow-500";
    const textGlow = isWasm
      ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
      : "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]";
    const shadowColor = isWasm
      ? "shadow-[0_0_15px_rgba(34,211,238,0.4)]"
      : "shadow-[0_0_15px_rgba(234,179,8,0.4)]";

    return (
      <div className="flex flex-col gap-4 p-6 bg-slate-800/50 rounded-2xl border border-slate-700 backdrop-blur-md relative overflow-hidden">
        <div
          className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 ${color}`}
        />

        <div className="flex justify-between items-center z-10">
          <h2 className="text-2xl font-black text-white tracking-widest uppercase">
            {label}
          </h2>
          <span className={`text-xl font-mono font-bold ${textGlow}`}>
            {progress.toLocaleString()} / {TOTAL_ITERATIONS.toLocaleString()}
          </span>
        </div>

        <div className="w-full h-8 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative z-10 shadow-inner">
          <motion.div
            className={`h-full ${color} ${shadowColor}`}
            initial={{ width: "0%" }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2 z-10">
          <div className="flex flex-col">
            <span className="text-slate-400 text-sm uppercase tracking-wider font-bold">
              Total Time
            </span>
            <span className="text-white text-2xl font-mono">
              {timeMs.toFixed(1)}{" "}
              <span className="text-sm text-slate-500">ms</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-sm uppercase tracking-wider font-bold">
              Latency/Item
            </span>
            <span className="text-white text-2xl font-mono">
              {progress > 0 ? ((timeMs * 1000) / progress).toFixed(2) : "0.00"}{" "}
              <span className="text-sm text-slate-500">μs</span>
            </span>
          </div>
        </div>

        <div className="mt-2 text-center p-4 bg-slate-900/60 rounded-xl border border-slate-800 z-10">
          <span className="block text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
            Operations / Second
          </span>
          <span className={`text-4xl font-black tracking-tighter ${textGlow}`}>
            {ops.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-lg opacity-60 ml-1">ops/s</span>
          </span>
        </div>
      </div>
    );
  };

  const exportSnapshot = async () => {
    if (!snapshotRef.current || isExporting) return;
    setIsExporting(true);
    setBenchmarkError(null);
    try {
      const dataUrl = await toPng(snapshotRef.current, {
        backgroundColor: "#0f172a",
        pixelRatio: 2,
      });
      
      let customConfigName: string | undefined;
      const safeName = customConfigName && typeof customConfigName === 'string' && customConfigName.trim() 
        ? customConfigName.trim() 
        : 'audit_report';

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${safeName}-${new Date().toISOString().slice(0, 19)}.png`;
      a.click();
    } catch (e) {
      console.error("Export failed", e);
      setBenchmarkError("Export failed: Browser blocked canvas rendering. Please check CORS or content blocker settings.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportJSON = () => {
    const report = {
      meta: {
        title: "Performance Duel — Executive Audit Report",
        timestamp: new Date().toISOString(),
        totalIterations: TOTAL_ITERATIONS,
        batchSize: BATCH_SIZE,
        batchCount: BATCH_COUNT,
      },
      javascript: {
        totalTimeMs: Number(jsMetrics.timeMs.toFixed(2)),
        totalTimeUs: Number(finalJsTimeUs.toFixed(0)),
        opsPerSecond: Number(currentJsOps.toFixed(0)),
        latencyPerItemUs: jsProgress > 0 ? Number(((jsMetrics.timeMs * 1000) / jsProgress).toFixed(2)) : 0,
      },
      wasm: {
        totalTimeMs: Number(wasmMetrics.timeMs.toFixed(2)),
        internalComputeTimeUs: finalWasmInternalUs,
        opsPerSecond: Number(currentWasmOps.toFixed(0)),
        latencyPerItemUs: wasmProgress > 0 ? Number(((wasmMetrics.timeMs * 1000) / wasmProgress).toFixed(2)) : 0,
      },
      analysis: {
        computeRatio: Number(computeRatio.toFixed(4)),
        computeRatioLabel: ratioLabel,
        jsWins,
        verdict: jsWins
          ? "JS JIT optimization excels in simple local loops. Edge Wasm provides deterministic global consistency."
          : "Go-Wasm outperforms JS in pure compute for this workload.",
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-duel-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pt-12 px-4 md:px-10 lg:px-20 bg-slate-950">
      <header className="mb-8 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4 border border-cyan-500/20">
          <span
            className="material-symbols-outlined text-sm"
            aria-hidden="true">
            bolt
          </span>
          Performance Duel
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
          JS vs Wasm Arena
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          A high-stakes computation battle. We execute{" "}
          {TOTAL_ITERATIONS.toLocaleString()} dynamic pricing operations
          sequentially to measure raw execution speed, showcasing the
          performance superiority of Go-Wasm instantiated on Cloudflare edge
          logic.
        </p>
      </header>

      <AnimatePresence>
        {benchmarkError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400"
            role="alert">
            <span className="material-symbols-outlined shrink-0" aria-hidden="true">
              error
            </span>
            <p className="font-bold text-sm">{benchmarkError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none bg-slate-950/40 backdrop-blur-[2px] cursor-not-allowed flex items-center justify-center">
            <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-cyan-500/30 text-cyan-400 px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(34,211,238,0.2)] flex items-center gap-3">
              <span className="material-symbols-outlined animate-spin" aria-hidden="true">
                sync
              </span>
              SYSTEM LOCKED: COMPUTING IN PROGRESS
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex flex-wrap gap-4 items-center">
        <button
          onClick={startBattle}
          disabled={isRunning}
          className="relative overflow-hidden group bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300 disabled:shadow-none hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] flex items-center gap-3">
          {isRunning ? (
            <span className="material-symbols-outlined animate-spin text-xl" aria-hidden="true">
              progress_activity
            </span>
          ) : (
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              play_circle
            </span>
          )}
          {isRunning ? "BATTLE IN PROGRESS..." : "START BATTLE"}

          {!isRunning && (
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
          )}
        </button>

      </div>

      <div
        ref={snapshotRef}
        className="pb-20 pt-4 rounded-2xl"
        style={{ backgroundColor: "#0f172a" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {renderGauge(
            "JavaScript (V8)",
            jsProgress,
            jsMetrics.timeMs,
            currentJsOps,
            false,
          )}
          {renderGauge(
            "Go-Wasm (Edge)",
            wasmProgress,
            wasmMetrics.timeMs,
            currentWasmOps,
            true,
          )}
        </div>

        <AnimatePresence>
          {(isFinished || isRunning) && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 rounded-full blur-[100px] opacity-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500 rounded-full blur-[100px] opacity-10 pointer-events-none" />

              <div className="px-8 py-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400" aria-hidden="true">
                    analytics
                  </span>
                  Deep Dive Analysis
                </h3>
              </div>

              {isFinished && (
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                <div className="flex flex-col gap-2">
                  <span className="text-slate-400 font-bold text-sm tracking-widest uppercase">
                    Total Operations
                  </span>
                  <span className="text-3xl font-black text-white">
                    {TOTAL_ITERATIONS.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-2 relative">
                  <span className="text-slate-400 font-bold text-sm tracking-widest uppercase">
                    Compute Ratio (Wasm vs JS)
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-4xl font-black drop-shadow-[0_0_12px_rgba(74,222,128,0.7)] ${
                        computeRatio >= 1 ? "text-green-400" : "text-cyan-400"
                      }`}>
                      {ratioLabel}
                    </span>
                  </div>
                  {computeRatio >= 1 && (
                    <span className="text-xs text-green-500/80 font-mono">
                      Go-Wasm wins ✓
                    </span>
                  )}
                  {jsWins && (
                    <span className="text-xs text-yellow-500/80 leading-snug">
                      JS JIT optimization excels in simple local loops, while Edge Wasm provides deterministic global consistency.
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 border-l-0 lg:border-l border-slate-800 lg:pl-8">
                  <span className="text-slate-400 font-bold text-sm tracking-widest uppercase">
                    Wasm Compute Time
                  </span>
                  <span className="text-3xl font-black text-white">
                    {finalWasmInternalUs.toLocaleString()}{" "}
                    <span className="text-xl text-cyan-500 font-mono">μs</span>
                  </span>
                  <span className="text-xs text-cyan-500">
                    Pure Go compute (ping subtraction)
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-slate-400 font-bold text-sm tracking-widest uppercase">
                    JS Total Time
                  </span>
                  <span className="text-3xl font-black text-white">
                    {finalJsTimeUs.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    <span className="text-xl text-yellow-500 font-mono">
                      μs
                    </span>
                  </span>
                  <span className="text-xs text-yellow-500">
                    Same unit for fair comparison
                  </span>
                </div>
              </div>
              )}

              {isRunning && !isFinished && (
                <div className="p-8 flex items-center justify-center gap-3 text-slate-500">
                  <span className="material-symbols-outlined animate-spin text-cyan-400" aria-hidden="true">
                    progress_activity
                  </span>
                  <span className="text-sm font-bold uppercase tracking-widest">
                    Computing final metrics...
                  </span>
                </div>
              )}

              {isFinished && (
                <div className="border-t border-slate-800 p-6">
                  <div className="bg-slate-950 border border-slate-700 rounded-xl overflow-hidden font-mono text-sm shadow-inner">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-700">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      <span className="ml-2 text-slate-500 text-xs tracking-widest uppercase">
                        technical_note.md
                      </span>
                    </div>
                    <div className="p-5 space-y-2 text-slate-300 leading-relaxed">
                      <p>
                        <span className="text-green-400 select-none">$ </span>
                        <span className="text-cyan-400 font-bold">NOTE</span>
                        <span className="text-slate-500">
                          {"// architectural_insight"}
                        </span>
                      </p>
                      <p className="pl-4 text-slate-300">
                        JavaScript V8 excels in local interactivity, but for an
                        orchestrator stress-testing{" "}
                        <span className="text-yellow-400 font-bold">
                          10,000 products
                        </span>{" "}
                        with dynamic pricing, we require{" "}
                        <span className="text-cyan-400">
                          absolute determinism
                        </span>
                        . We offloaded the heavy logic to{" "}
                        <span className="text-green-400 font-bold">
                          Go-Wasm at the Edge
                        </span>{" "}
                        to ensure the user&apos;s main thread remains free for
                        UI rendering{" "}
                        <span className="text-yellow-400">(60 FPS)</span>,
                        delegating complex computations to an optimized
                        environment that doesn&apos;t depend on the user&apos;s
                        hardware.
                      </p>
                      <p className="pl-4 text-slate-400">
                        This architecture prioritizes{" "}
                        <span className="text-cyan-300">
                          system-wide consistency
                        </span>{" "}
                        and <span className="text-cyan-300">security</span> over
                        local micro-latencies.
                      </p>
                      <p>
                        <span className="text-green-400 select-none">$ </span>
                        <span className="text-slate-600 animate-pulse">█</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isFinished && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-col items-center gap-4">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
                Export Audit Report
              </span>
              <div className="flex gap-4">
                <button
                  onClick={exportSnapshot}
                  disabled={isExporting}
                  className="group relative overflow-hidden bg-transparent border border-cyan-500/40 text-cyan-400 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-wait font-bold px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">
                    {isExporting ? "progress_activity" : "image"}
                  </span>
                  <span className="flex flex-col items-start">
                    <span className="text-sm">{isExporting ? "Rendering..." : "Export PNG"}</span>
                    <span className="text-[10px] text-slate-500 font-normal">High-res snapshot</span>
                  </span>
                  {isExporting && (
                    <span className="material-symbols-outlined animate-spin text-sm absolute top-1 right-1 text-cyan-400/50" aria-hidden="true">
                      sync
                    </span>
                  )}
                </button>

                <button
                  onClick={exportJSON}
                  className="group relative overflow-hidden bg-transparent border border-yellow-500/40 text-yellow-400 hover:text-white hover:border-yellow-400 hover:bg-yellow-500/10 font-bold px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 shadow-[0_0_10px_rgba(234,179,8,0.1)] hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">
                    data_object
                  </span>
                  <span className="flex flex-col items-start">
                    <span className="text-sm">Export JSON</span>
                    <span className="text-[10px] text-slate-500 font-normal">Raw benchmark data</span>
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
