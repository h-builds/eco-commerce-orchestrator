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
 * Negotiates state reconciliation between Edge-resolved pricing and 
 * client-side simulation. Falls back to a deterministic JS port during 
 * Wasm agent failure or temporal state (Time Machine) overrides to 
 * ensure UI integrity.
 */
export function SimulatingProductCard({ product, priority = false }: SimulatingProductCardProps) {
  const { simulatedHour } = useSimulation();

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
