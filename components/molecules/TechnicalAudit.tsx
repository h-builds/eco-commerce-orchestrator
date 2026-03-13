'use client';
import { use } from 'react';

interface TechnicalAuditProps {
  cacheStatus: "HIT" | "MISS" | "STALE" | "BYPASS" | "ISR (1h)";
  latencyPromise: Promise<number>;
}

export function TechnicalAudit({ cacheStatus, latencyPromise }: TechnicalAuditProps) {
  const latency = use(latencyPromise);

  let latencyColorClass = "text-slate-500 bg-slate-500/10";
  if (latency !== null) {
    if (latency < 5) latencyColorClass = "text-emerald-500 bg-emerald-500/10";
    else if (latency < 15) latencyColorClass = "text-amber-500 bg-amber-500/10";
    else latencyColorClass = "text-rose-500 bg-rose-500/10";
  }

  return (
    <div className="tour-technical-audit p-5 mt-8 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 font-mono text-sm space-y-3 text-slate-600 dark:text-slate-400">
      <h3 className="text-slate-900 dark:text-slate-100 font-bold uppercase tracking-widest mb-4 text-xs flex items-center gap-2">
        <span className="material-symbols-outlined text-emerald-500 text-[1.1rem]" aria-hidden="true">analytics</span>
        Technical Audit
      </h3>
      <div className="flex justify-between items-center bg-white dark:bg-slate-900/50 px-4 py-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <span className="font-semibold text-xs text-slate-500 uppercase">Edge Cache Status</span>
        <span className="text-emerald-500 font-bold tracking-tight bg-emerald-500/10 px-2 py-0.5 rounded text-xs">{cacheStatus}</span>
      </div>
      <div className="flex justify-between items-center bg-white dark:bg-slate-900/50 px-4 py-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <span className="font-semibold text-xs text-slate-500 uppercase">Wasm Execution Latency</span>
        <span 
          className={`font-bold tracking-tight px-2 py-0.5 rounded text-xs cursor-help ${latencyColorClass}`}
          title="Execution time of the Go-Wasm logic at the Edge"
        >
          {latency !== null ? `${latency.toFixed(2)}ms` : '...'}
        </span>
      </div>
    </div>
  );
}
