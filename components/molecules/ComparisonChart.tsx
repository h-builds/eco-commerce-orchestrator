"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { useSimulation } from "@/lib/SimulationContext";
import type { Product } from "@/components/molecules/ProductCard";

interface ComparisonChartProps {
  products: Product[];
  chartData: Array<Record<string, number>>;
}

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: number;
}

const COLORS = ["#10b981", "#f59e0b", "#3b82f6"];

/**
 * Renders temporal pricing details including Delta P (peak spread) 
 * to surface volatility anomalies across compared Edge nodes.
 */
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length && typeof label === 'number') {
    let maxDiff = 0;
    if (payload.length > 1) {
      const prices = payload.map((p) => p.value);
      maxDiff = Math.max(...prices) - Math.min(...prices);
    }

    const suffix = label >= 12 ? "PM" : "AM";
    const displayLabel = label % 12 || 12;

    return (
      <div className="bg-slate-900 border border-slate-700/50 p-3 rounded-lg shadow-xl shadow-black/50 text-xs text-white min-w-[150px]">
        <p className="font-bold text-slate-300 mb-2 border-b border-slate-700 pb-1">
          {displayLabel}:00 {suffix}
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex justify-between gap-4 py-0.5">
            <span style={{ color: entry.color }} className="font-semibold line-clamp-1 max-w-[100px]">
              {entry.name}
            </span>
            <span className="font-mono">${entry.value.toFixed(2)}</span>
          </div>
        ))}
        {payload.length > 1 && (
          <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between text-amber-400 font-bold">
            <span>Δ (Max Diff)</span>
            <span className="font-mono">${maxDiff.toFixed(2)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

/**
 * Visualizes deterministic price divergence across multiple product nodes. 
 * Orchestrates the temporal reference point based on the active 
 * simulation state to contrast real-time Edge predictions.
 */
export function ComparisonChart({ products, chartData }: ComparisonChartProps) {
  const { simulatedHour } = useSimulation();
  
  const currentHour = new Date().getHours();
  const activeHour = simulatedHour !== null ? simulatedHour : currentHour;

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
          <XAxis 
            dataKey="hour" 
            stroke="#64748b" 
            fontSize={12}
            tickFormatter={(value) => {
              const suffix = value >= 12 ? "PM" : "AM";
              const display = value % 12 || 12;
              return `${display}${suffix}`;
            }}
            tickMargin={10}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12}
            tickFormatter={(value) => `$${value}`}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }} />
          
          <ReferenceLine 
            x={activeHour} 
            stroke="#f59e0b" 
            strokeDasharray="3 3" 
            label={{ position: 'top', value: 'Active Sim', fill: '#f59e0b', fontSize: 10, offset: 10 }}
          />

          {products.map((p, i) => (
            <Line
              key={p.id}
              type="monotone"
              dataKey={p.id}
              name={p.name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={3}
              dot={{ r: 0, fill: COLORS[i % COLORS.length], strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#0f172a", stroke: COLORS[i % COLORS.length], strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={1500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
