import { useMemo } from 'react';

interface EdgeMapProps {
  nodes: {
    id: string;
    volatility: number;
  }[];
}

export function EdgeMap({ nodes }: EdgeMapProps) {
  // A CSS Grid to represent the 1000 nodes.
  // We want approximately a 40x25 grid to fit 1000 items densely.
  
  const cells = useMemo(() => {
    return nodes.map(node => {
      // Determine color based on volatility
      // < 1.0 (Discount) -> Emerald
      // = 1.0 (Neutral) -> Slate
      // > 1.0 (Surge) -> Amber/Red
      let colorClass = 'bg-slate-700'; // base neutral
      
      if (node.volatility < 0.95) {
        colorClass = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] z-10'; // deep discount
      } else if (node.volatility < 1.0) {
        colorClass = 'bg-emerald-500/60'; // slight discount
      } else if (node.volatility > 1.1) {
        colorClass = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10'; // massive surge
      } else if (node.volatility > 1.0) {
        colorClass = 'bg-amber-400/80 shadow-[0_0_4px_rgba(251,191,36,0.5)] z-10'; // slight surge
      }

      return (
        <div 
          key={node.id} 
          className={`w-full pt-[100%] rounded-sm transition-colors duration-500 ${colorClass}`}
          title={`Node: ${node.id.split('-')[0]} | Vol: ${node.volatility.toFixed(2)}x`}
        />
      );
    });
  }, [nodes]);

  return (
    <div className="w-full h-full pb-8">
      <div 
        className="w-full h-full grid gap-[2px] p-2 bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(12px, 1fr))',
          gridAutoRows: 'min-content'
        }}
      >
        {cells}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-mono px-2">
        <div className="flex items-center gap-2 border border-slate-800 rounded bg-slate-900 px-2 py-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)] block" />
          <span>Surplus</span>
        </div>
        <div>
          <span>1,000 Wasm Nodes Active</span>
        </div>
        <div className="flex items-center gap-2 border border-slate-800 rounded bg-slate-900 px-2 py-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)] block" />
          <span>Surge</span>
        </div>
      </div>
    </div>
  );
}
