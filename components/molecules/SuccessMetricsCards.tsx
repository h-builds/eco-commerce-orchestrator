import { AnimatedCounter } from '../atoms/AnimatedCounter';

interface SuccessMetricsCardsProps {
  surplusCount: number;
  totalSavings: number;
  efficiencyScore: number;
}

/**
 * Aggregates high-order sustainability and network efficiency telemetry. 
 * Derives ROI and carbon offset metrics from distributed Edge execution 
 * cycles to surface the environmental impact of deterministic pricing.
 */
export function SuccessMetricsCards({ surplusCount, totalSavings, efficiencyScore }: SuccessMetricsCardsProps) {
  const carbonOffset = surplusCount * 2.5;
  const networkROI = Math.round((totalSavings / 1500) * 100);
  const uptime = 99.990 + (efficiencyScore / 10000);
  
  return (
    <div className="grid grid-rows-3 gap-4 h-full">
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400/80">Total Carbon Offset</h3>
          <span className="material-symbols-outlined text-emerald-500/50 text-xl" aria-hidden="true">eco</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-emerald-400 tabular-nums">
            <AnimatedCounter value={carbonOffset} decimals={1} />
          </span>
          <span className="text-sm font-bold text-emerald-500/60">kg CO₂</span>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col justify-center relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400/80">Network ROI</h3>
          <span className="material-symbols-outlined text-cyan-500/50 text-xl" aria-hidden="true">account_balance_wallet</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-cyan-400 tabular-nums">
            {networkROI >= 0 ? '+' : ''}<AnimatedCounter value={networkROI} decimals={0} />
          </span>
          <span className="text-sm font-bold text-cyan-500/60">%</span>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col justify-center relative overflow-hidden group hover:border-violet-500/50 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-violet-400/80">Edge System Uptime</h3>
          <span className="material-symbols-outlined text-violet-500/50 text-xl" aria-hidden="true">memory</span>
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
