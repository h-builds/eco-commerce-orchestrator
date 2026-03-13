'use client';


import { useMemo } from 'react';
import { useSimulation } from '@/lib/SimulationContext';
import { simulatePrice } from '@/lib/pricingEngine';
import { ProductCard, type Product } from './ProductCard';

interface SimulatingProductCardProps {
  product: Product;
  priority?: boolean;
}

/**
 * Negotiates state reconciliation between server-resolved Edge pricing 
 * and local client-side simulation. If the Edge agent fails or the 
 * global 'Time Machine' is active, it transparently falls back to the 
 * deterministic JS port to maintain UI integrity.
 */
export function SimulatingProductCard({ product, priority = false }: SimulatingProductCardProps) {
  const { simulatedHour } = useSimulation();

  /**
   * Reconciles Edge compute results with hot-swappable client simulation 
   * blocks to bypass rendering artifacts during Wasm agent failure 
   * or manual hour shifting.
   */
  const displayProduct = useMemo((): Product => {
    const isSimulating = simulatedHour !== null;
    const agentFailed  = product.agent_confidence === 0;

    if (!isSimulating && !agentFailed) {
      return product;
    }

    const { live_price, agent_confidence } = simulatePrice(
      product.id,
      product.price,
      product.stock,
      simulatedHour,
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
