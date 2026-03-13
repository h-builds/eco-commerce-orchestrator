'use client';

// ---------------------------------------------------------------------------
// SimulatingProductCard
//
// Responsibilities:
//  1. LIVE mode (simulatedHour = null):
//     - If the Go Wasm pricing agent succeeded (agent_confidence > 0),
//       use the server-resolved prices as-is.
//     - If the agent failed (agent_confidence === 0, the known Wasm fallback),
//       transparently re-compute via the client-side pricing engine at the
//       real current hour so the badge always shows a meaningful value.
//  2. SIMULATION mode (simulatedHour = 0-23):
//     - Always use the client-side engine seeded by the simulated hour.
// ---------------------------------------------------------------------------

import { useMemo } from 'react';
import { useSimulation } from '@/lib/SimulationContext';
import { simulatePrice } from '@/lib/pricingEngine';
import { ProductCard, type Product } from './ProductCard';

interface SimulatingProductCardProps {
  product: Product;
  priority?: boolean;
}

export function SimulatingProductCard({ product, priority = false }: SimulatingProductCardProps) {
  const { simulatedHour } = useSimulation();

  const displayProduct = useMemo((): Product => {
    const isSimulating = simulatedHour !== null;
    const agentFailed  = product.agent_confidence === 0;

    if (!isSimulating && !agentFailed) {
      // Happy path: live mode + Wasm agent worked — trust server prices.
      return product;
    }

    // Either simulating a different hour, or the Wasm agent failed in live mode.
    // In both cases, compute deterministic prices client-side.
    // simulatedHour = null → simulatePrice uses the real current hour.
    const { live_price, agent_confidence } = simulatePrice(
      product.id,
      product.price,   // base price from DB (always accurate)
      product.stock,
      simulatedHour,   // null = real hour, 0-23 = simulated hour
    );

    return { ...product, live_price, agent_confidence };
  }, [product, simulatedHour]);

  return (
    <ProductCard
      product={displayProduct}
      isSimulating={simulatedHour !== null}
      priority={priority}
    />
  );
}
