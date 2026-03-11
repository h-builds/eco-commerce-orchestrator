'use client';

import { useEffect, useState } from 'react';

export function BigNumberMetric({ value }: { value: number }) {
  // We'll animate the number counting up/down to the value
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    // Simple spring-like ease towards value
    let cancel = false;
    let current = displayValue;
    
    const animate = () => {
      if (cancel) return;
      
      const diff = value - current;
      if (Math.abs(diff) < 0.1) {
        setDisplayValue(value);
        return;
      }
      
      current += diff * 0.15;
      setDisplayValue(current);
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
    return () => { cancel = true; };
  }, [value, displayValue]);

  const isPositive = displayValue >= 0;
  
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl h-full flex flex-col justify-center">
      {/* Glow */}
      <div className={`absolute -top-24 -right-24 h-48 w-48 rounded-full blur-[80px] transition-colors duration-1000 ${isPositive ? 'bg-emerald-500/20' : 'bg-red-500/20'}`} />
      
      <h2 className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-2">Total Live Savings</h2>
      
      <div className="flex items-baseline gap-2">
         <span className={`text-[80px] font-black tabular-nums tracking-tighter leading-none transition-colors duration-500 ${isPositive ? 'text-emerald-400' : 'text-slate-200'}`}>
           ${Math.abs(displayValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
         </span>
         {isPositive ? (
           <span className="text-emerald-500 material-symbols-outlined text-4xl">trending_down</span>
         ) : (
           <span className="text-red-500 material-symbols-outlined text-4xl">trending_up</span>
         )}
      </div>
      
      <p className="mt-4 text-sm text-slate-400 max-w-sm">
        Sum of real-time price reductions across all 1,000 simulated nodes vs their static base prices.
      </p>
    </div>
  );
}
