import { AnimatedCounter } from '../atoms/AnimatedCounter';

interface SuccessMetricsCardsProps {
  surplusCount: number;
  totalSavings: number;
  efficiencyScore: number;
}

export function SuccessMetricsCards({ surplusCount, totalSavings, efficiencyScore }: SuccessMetricsCardsProps) {
  // Rough estimate logic: each surplus item bought offsets ~2.5kg of carbon
  const carbonOffset = surplusCount * 2.5;
  const networkROI = Math.round((totalSavings / 1500) * 100);
  const uptime = 99.990 + (efficiencyScore / 10000);
  
  return (
    <div className="grid grid-rows-3 gap-4 h-full">
      
      {/* Carbon Offset Card */}
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-slate-900 p-5 flex flex-col justify-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400/80">Total Carbon Offset</h3>
          <span className="material-symbols-outlined text-emerald-500/50 text-xl">eco</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-emerald-400 tabular-nums">
            <AnimatedCounter value={carbonOffset} decimals={1} />
          </span>
          <span className="text-sm font-bold text-emerald-500/60">kg CO₂</span>
        </div>
      </div>

      {/* Network ROI Card */}
      <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/60 to-slate-900 p-5 flex flex-col justify-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-700" />
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400/80">Network ROI</h3>
          <span className="material-symbols-outlined text-cyan-500/50 text-xl">account_balance_wallet</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-cyan-400 tabular-nums">
            {networkROI >= 0 ? '+' : ''}<AnimatedCounter value={networkROI} decimals={0} />
          </span>
          <span className="text-sm font-bold text-cyan-500/60">%</span>
        </div>
      </div>

      {/* System Uptime Card */}
      <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 to-slate-900 p-5 flex flex-col justify-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all duration-700" />
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-violet-400/80">Edge System Uptime</h3>
          <span className="material-symbols-outlined text-violet-500/50 text-xl">memory</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-violet-400 tabular-nums">
            <AnimatedCounter value={uptime} decimals={3} />
          </span>
          <span className="text-sm font-bold text-violet-500/60">%</span>
        </div>
      </div>

    </div>
  );
}
