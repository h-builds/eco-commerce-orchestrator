'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EdgeMapNode {
  id: string;
  name: string;
  livePrice: number;
  volatility: number;
}

interface EdgeMapProps {
  nodes: EdgeMapNode[];
}

function getStatus(volatility: number): 'Surplus' | 'Nominal' | 'Surge' {
  if (volatility < 1) return 'Surplus';
  if (volatility > 1) return 'Surge';
  return 'Nominal';
}

function getStatusColorClass(volatility: number): string {
  if (volatility < 1.0) return 'text-emerald-400';
  if (volatility > 1.1) return 'text-red-500';
  if (volatility > 1.0) return 'text-amber-400';
  return 'text-slate-400';
}

/**
 * Visualizes high-cardinality telemetry from 1,000 Edge nodes. Implements 
 * event delegation for tooltip orchestration to minimize main-thread 
 * overhead during rapid grid exploration.
 */
export function EdgeMap({ nodes }: EdgeMapProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number; flipY: boolean }>({ x: 0, y: 0, flipY: false });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleGridMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const cell = (e.target as HTMLElement).closest('[data-index]');
      if (!cell) {
        setHoveredIndex(null);
        return;
      }
      const raw = cell.getAttribute('data-index');
      if (raw == null) return;
      const index = parseInt(raw, 10);
      if (Number.isNaN(index) || index < 0 || index >= nodes.length) return;
      if (!containerRef.current) return;
      
      setHoveredIndex(index);

      const rect = containerRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top - 12;
      let flipY = false;
      
      const tooltipWidth = 220;
      const tooltipHeight = 100;
      const halfWidth = tooltipWidth / 2;

      if (y < tooltipHeight) {
        flipY = true;
        y = e.clientY - rect.top + 24;
      }

      if (x + halfWidth > rect.width) {
        x = rect.width - halfWidth - 16;
      } else if (x - halfWidth < 0) {
        x = halfWidth + 16;
      }

      setTooltipPosition({ x, y, flipY });
    },
    [nodes.length],
  );

  const handleGridMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const cells = useMemo(() => {
    return nodes.map((node, index) => {
      let colorClass = 'bg-slate-700';
      if (node.volatility < 0.95) {
        colorClass = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] z-10';
      } else if (node.volatility < 1.0) {
        colorClass = 'bg-emerald-500/60';
      } else if (node.volatility > 1.1) {
        colorClass = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10';
      } else if (node.volatility > 1.0) {
        colorClass = 'bg-amber-400/80 shadow-[0_0_4px_rgba(251,191,36,0.5)] z-10';
      }

      return (
        <div
          key={node.id}
          data-index={index}
          className={`w-full pt-[100%] rounded-sm transition-colors duration-500 ${colorClass}`}
          role="img"
          aria-label={`${node.name}, ${getStatus(node.volatility)}`}
        />
      );
    });
  }, [nodes]);

  const hoveredNode = hoveredIndex !== null ? nodes[hoveredIndex] : null;

  return (
    <div className="tour-edge-map w-full h-full pb-8 relative" ref={containerRef}>
      <div
        className="w-full h-full grid gap-[2px] p-2 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(12px, 1fr))',
          gridAutoRows: 'min-content',
        }}
        onMouseMove={handleGridMouseMove}
        onMouseLeave={handleGridMouseLeave}
      >
        {cells}
      </div>

      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            key={hoveredIndex}
            className="absolute z-50 pointer-events-none px-3 py-2 rounded-lg border border-white/10 bg-slate-900/90 backdrop-blur-md shadow-xl text-xs text-slate-200 min-w-[140px] max-w-[220px]"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: tooltipPosition.flipY ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="font-semibold text-slate-100 break-words leading-tight" title={hoveredNode.name}>
              {hoveredNode.name}
            </div>
            <div className={`mt-1 font-mono tabular-nums ${getStatusColorClass(hoveredNode.volatility)}`}>
              ${hoveredNode.livePrice.toFixed(2)}
            </div>
            <div className="mt-0.5 text-slate-400">
              {getStatus(hoveredNode.volatility)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-mono px-2">
        <div className="flex items-center gap-2 border border-white/10 rounded bg-white/5 backdrop-blur-md px-2 py-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)] block" />
          <span>Surplus</span>
        </div>
        <div>
          <span>1,000 Wasm Nodes Active</span>
        </div>
        <div className="flex items-center gap-2 border border-white/10 rounded bg-white/5 backdrop-blur-md px-2 py-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)] block" />
          <span>Surge</span>
        </div>
      </div>
    </div>
  );
}
