'use client';

import { use, useState, useMemo, useEffect } from 'react';

interface VolatilityChartProps {
  dataPromise: Promise<{ hour: number; price: number; confidence: number }[]>;
}

// Helper for smooth monotonic-like curve
function catmullRom2bezier(pts: [number, number][]) {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0][0]},${pts[0][1]}`;
  let d = `M ${pts[0][0]},${pts[0][1]} `;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i === 0 ? pts[0] : pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i + 2 < pts.length ? pts[i + 2] : p2;

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;

    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]} `;
  }
  return d;
}

export function VolatilityChart({ dataPromise }: VolatilityChartProps) {
  const data = use(dataPromise);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [currentHour, setCurrentHour] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => setCurrentHour(new Date().getUTCHours());
    // Use timeout to avoid synchronous state update in effect
    const timeout = setTimeout(updateTime, 0);
    const interval = setInterval(updateTime, 60000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const { path, fillPath, points } = useMemo(() => {
    const minP = Math.min(...data.map(d => d.price));
    const maxP = Math.max(...data.map(d => d.price));
    // Pad the range slightly so lines don't hit the absolute edges
    const pRange = (maxP - minP) || 1;
    const paddedMin = minP - pRange * 0.1;
    const paddedMax = maxP + pRange * 0.1;
    const totalRange = paddedMax - paddedMin;

    const pts: [number, number][] = data.map((d, i) => {
      const x = (i / 23) * 100;
      const y = 100 - ((d.price - paddedMin) / totalRange) * 100;
      return [x, y];
    });

    const curve = catmullRom2bezier(pts);
    const fill = `${curve} L 100,100 L 0,100 Z`;

    return { minPrice: paddedMin, maxPrice: paddedMax, range: totalRange, path: curve, fillPath: fill, points: pts };
  }, [data]);

  const activeIdx = hoveredIdx !== null ? hoveredIdx : currentHour;
  const activeData = data[activeIdx];

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full h-64 p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col relative overflow-hidden shadow-2xl group">
        <div className="flex justify-between items-start z-10 mb-2 relative">
          <div>
            <h4 className="text-emerald-400 font-bold tracking-widest uppercase text-[10px] mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs" aria-hidden="true">monitoring</span>
              Price Volatility
            </h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-white">${activeData?.price.toFixed(2)}</span>
              <span className="text-xs font-mono font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Demand Factor: {(activeData?.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
             <span className="text-slate-400 text-xs font-mono font-medium bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700/50">
                {activeData?.hour.toString().padStart(2, '0')}:00 UTC {hoveredIdx !== null ? '(Simulated)' : '(Live)'}
             </span>
          </div>
        </div>
        
        {/* SVG Chart */}
        <div className="relative flex-1 mt-6 w-full h-full">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />

            {/* Path and Fill */}
            <path d={fillPath} fill="url(#cyanGradient)" />
            <path d={path} fill="none" className="stroke-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Points (invisible hover targets + active marker) */}
            {points.map((p, i) => {
               const isActive = i === activeIdx;
               const isCurrent = i === currentHour;

               if (!isActive && !isCurrent) return null;

               return (
                 <g key={i}>
                   {/* Vertical active line */}
                   {isActive && (
                      <line x1={p[0]} y1={p[1]} x2={p[0]} y2="100" stroke="#10b981" strokeWidth="0.5" strokeDasharray="2 2" className="opacity-70" />
                   )}

                   {/* Current hour marker */}
                   {isCurrent && (
                     <>
                       <circle cx={p[0]} cy={p[1]} r="4" className="fill-emerald-500 opacity-50" />
                       <circle cx={p[0]} cy={p[1]} r="2" className="fill-white" />
                     </>
                   )}
                   
                   {/* Hover Active Dot */}
                   {isActive && !isCurrent && (
                     <circle cx={p[0]} cy={p[1]} r="2.5" className="fill-white stroke-emerald-500 stroke-[1.5px] drop-shadow-[0_0_4px_rgba(16,185,129,1)]" />
                   )}
                 </g>
               )
            })}
          </svg>

          {/* Hover Overlay Interactions */}
          <div className="absolute inset-0 flex">
            {data.map((_, i) => (
              <div 
                key={i} 
                className="flex-1 h-full cursor-crosshair"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </div>
        </div>

        {/* X-Axis labels */}
        <div className="flex justify-between text-[9px] font-semibold text-slate-500 z-10 mt-3 pt-2 border-t border-slate-800">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>

      {/* Technical Context Panel */}
      <div className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex gap-3 items-start">
        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg mt-0.5" aria-hidden="true">info</span>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          This volatility is computed in real-time by our <strong className="text-slate-900 dark:text-slate-200">Go-Wasm agent</strong>. It simulates market fluctuations based on deterministic edge seeds.
        </p>
      </div>
    </div>
  );
}
