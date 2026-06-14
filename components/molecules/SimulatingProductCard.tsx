'use client';

import { useState, useEffect } from 'react';
import { useSimulation } from '@/lib/SimulationContext';
import { pricingWorkerClient } from '@/lib/pricingWorkerClient';
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

  const [displayProduct, setDisplayProduct] = useState<Product>(product);
  const [isError, setIsError] = useState(false);
  const [ariaMessage, setAriaMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const isSimulating = simulatedHour !== null;
    const agentFailed  = product.agent_confidence === 0;

    if (!isSimulating && !agentFailed) {
      setTimeout(() => {
        if (isMounted) {
          setDisplayProduct(product);
          setIsError(false);
          setAriaMessage('');
        }
      }, 0);
      return;
    }

    setTimeout(() => {
      if (isMounted) {
        setIsError(false);
        setAriaMessage('Calculating dynamic price...');
      }
    }, 0);

    pricingWorkerClient.simulatePriceAsync(product.id, product.price, product.stock, simulatedHour)
      .then((res) => {
        if (!isMounted) return;
        setDisplayProduct({ ...product, live_price: res.live_price, agent_confidence: res.agent_confidence });
        setAriaMessage(`Price updated to $${res.live_price.toFixed(2)}.`);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Worker simulation failed:', err);
        setDisplayProduct(product);
        setIsError(true);
        setAriaMessage('Dynamic pricing unavailable. Displaying standard base price.');
      });

    return () => {
      isMounted = false;
    };
  }, [product, simulatedHour]);

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {ariaMessage}
      </div>
      <div className={isError ? "ring-2 ring-red-500/50 rounded-2xl relative" : "relative"}>
        {isError && (
          <div className="absolute -top-3 -right-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
            <span className="material-symbols-outlined notranslate text-[14px]" aria-hidden="true" translate="no">warning</span>
            Fallback Price
          </div>
        )}
        <ProductCard
          product={displayProduct}
          isSimulating={simulatedHour !== null && !isError}
          priority={priority}
        />
      </div>
    </>
  );
}
