"use client";

import { useState, useDeferredValue, useEffect, useCallback, useRef } from 'react';
import { type Product } from '@/components/molecules/ProductCard';
import { SimulatingProductCard } from '@/components/molecules/SimulatingProductCard';
import { SearchBar } from '@/components/molecules/SearchBar';
import { ProductSkeleton } from '@/components/molecules/ProductSkeleton';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { ComparisonBar } from '@/components/organisms/ComparisonBar';
import { getSeedHex } from '@/lib/pricingEngine';
import { WasmTelemetry, captureMemoryMb } from '@/lib/wasmTelemetry';
import { useSimulation } from '@/lib/SimulationContext';
import { orchestrateBatches, chunkArray } from '@/lib/batchOrchestrator';
import { batchLivePrices } from '@/lib/pricing';

const SEARCH_QUERY = `
  query SearchProducts($search: String, $offset: Int) {
    products(limit: 20, search: $search, offset: $offset) {
      id
      name
      slug
      description
      price
      category
      stock
      rating
      image_url
      live_price
      agent_confidence
    }
  }
`;

interface ProductBrowserProps {
  initialProducts: Product[];
}

/**
 * Orchestrates debounced GraphQL persistence searches against the Edge D1 
 * database. Dispatches batched Wasm telemetry metrics during browser idle 
 * periods (requestIdleCallback) to baseline client-side performance parity 
 * without impacting the main frame render budget.
 */
export function ProductBrowser({ initialProducts }: ProductBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const { simulatedHour } = useSimulation();
  const prevSimulatedHour = useRef<number | null>(simulatedHour);

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const [isFetchingInitial, setIsFetchingInitial] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const isPendingSearch = searchTerm !== deferredSearchTerm || searchTerm !== debouncedSearchTerm || isFetchingInitial;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(deferredSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [deferredSearchTerm]);

  const fetchProducts = useCallback(async (currentSearch: string, currentOffset: number, isInitial: boolean) => {
    if (isInitial) {
      setIsFetchingInitial(true);
    } else {
      setIsFetchingNextPage(true);
    }

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: SEARCH_QUERY,
          variables: { 
            search: currentSearch.trim() || undefined,
            offset: currentOffset
          }
        }),
      });
      
      interface SearchGraphQLResponse {
        data?: { products?: Product[] };
        errors?: Array<{ message: string }>;
      }
      const result = (await response.json()) as SearchGraphQLResponse;
      
      const newProducts = result.data?.products ?? [];
      
      if (isInitial) {
        setProducts(newProducts);
      } else {
        setProducts((prev) => {
          const existingIds = new Set(prev.map(p => p.id));
          const appended = newProducts.filter(p => !existingIds.has(p.id));
          return [...prev, ...appended];
        });
      }

      setHasMore(newProducts.length === 20);

    } catch (err) {
      console.error('Fetch failed:', err);
      if (isInitial) setProducts([]);
    } finally {
      if (isInitial) setIsFetchingInitial(false);
      else setIsFetchingNextPage(false);
    }
  }, []);

  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    if (!debouncedSearchTerm.trim()) {
      setOffset(0);
      setProducts(initialProducts);
      setHasMore(initialProducts.length >= 20);
      return;
    }

    setOffset(0);
    fetchProducts(debouncedSearchTerm, 0, true);
  }, [debouncedSearchTerm, fetchProducts, initialProducts]);

  const loadMore = useCallback(() => {
    if (isFetchingNextPage || isFetchingInitial || !hasMore) return;
    const nextOffset = offset + 20;
    setOffset(nextOffset);
    fetchProducts(debouncedSearchTerm, nextOffset, false);
  }, [offset, isFetchingNextPage, isFetchingInitial, hasMore, debouncedSearchTerm, fetchProducts]);

  const { targetRef } = useIntersectionObserver(loadMore, {
    rootMargin: '400px',
    threshold: 0.1
  });

  /**
   * Reactive Edge Batch Dispatcher
   * Links the debounced Simulation Time Machine slider directly to the Wasm
   * Edge. Executes the identical Parallel Batching logic used in stress tests,
   * injecting high-density Processing states into the TelemetryHUD.
   */
  useEffect(() => {
    if (products.length === 0) return;
    
    // Only invoke heavy processing if the hour changed or this is the initial load
    if (simulatedHour === prevSimulatedHour.current && prevSimulatedHour.current !== undefined) {
      return;
    }
    prevSimulatedHour.current = simulatedHour;

    let isCancelled = false;

    const runReactiveBatch = async () => {
      // 1. Visual Feedback: Processing State
      const hud = document.getElementById('telemetry-hud');
      hud?.classList.remove('shadow-[0_0_20px_rgba(0,255,255,0.15)]');
      hud?.classList.add('shadow-[0_0_20px_rgba(245,158,11,0.5)]', 'ring-2', 'ring-amber-500');

      try {
        const chunks = chunkArray(products, 500);
        await orchestrateBatches(
          chunks,
          async (chunk) => {
            if (isCancelled) return 0;
            
            // Yield to main thread for a fluid 60 FPS slider experience
            await new Promise<void>((r) => requestAnimationFrame(() => r()));
            
            const t0 = performance.now();
            await batchLivePrices(chunk.map(p => ({ id: p.id, price: p.price, stock: p.stock })));
            const executionTimeMs = performance.now() - t0;
            
            // 2. Telemetry Sync: populate WASM_PROC config
            WasmTelemetry.pushEntry({
              batchSize: chunk.length,
              executionTimeMs,
              seedHex: getSeedHex(chunk[0].id, simulatedHour),
              memoryMb: captureMemoryMb(),
            });
            return chunk.length;
          },
          () => {} // Omit stress test progress to keep UI clean
        );
      } finally {
        if (!isCancelled) {
          // Snap back to green/cyan when finalized
          hud?.classList.remove('shadow-[0_0_20px_rgba(245,158,11,0.5)]', 'ring-2', 'ring-amber-500');
          hud?.classList.add('shadow-[0_0_20px_rgba(0,255,255,0.15)]');
        }
      }
    };

    runReactiveBatch();

    return () => {
      isCancelled = true;
      const hud = document.getElementById('telemetry-hud');
      hud?.classList.remove('shadow-[0_0_20px_rgba(245,158,11,0.5)]', 'ring-2', 'ring-amber-500');
      hud?.classList.add('shadow-[0_0_20px_rgba(0,255,255,0.15)]');
    };
  }, [products, simulatedHour]);

  return (
    <div className="flex flex-col w-full">
      <div className="sticky top-20 z-20 pb-4 bg-transparent pt-4 -mt-4">
        <SearchBar value={searchTerm} onChange={setSearchTerm} isPending={isPendingSearch} />
      </div>
      
      <div className={`transition-opacity duration-300 ${isPendingSearch ? 'opacity-50' : 'opacity-100'}`}>
        {!products || products.length === 0 ? (
          <div className="p-8 mt-12 text-center text-slate-500 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined notranslate text-6xl text-slate-300 dark:text-slate-700" aria-hidden="true" translate="no">search_off</span>
            <p className="text-xl font-medium">No results found.</p>
            <p className="text-sm">We couldn&apos;t find anything matching &quot;{debouncedSearchTerm}&quot;. Try another search term.</p>
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
              role="region"
              aria-label="Product Catalog"
            >
              {products.map((product, i) => (
                <SimulatingProductCard key={product.id} product={product} priority={i < 6} />
              ))}
              
              {isFetchingNextPage && 
                Array.from({ length: 4 }).map((_, i) => (
                  <ProductSkeleton key={`skeleton-${i}`} />
                ))
              }
            </div>

            {hasMore ? (
              <div ref={targetRef} className="w-full h-20 mt-8 flex items-center justify-center">
                {!isFetchingNextPage && <span className="sr-only">Scroll down to load more products</span>}
              </div>
            ) : (
              <div className="w-full py-12 mt-8 text-center border-t border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined notranslate text-2xl mb-2 inline-block opacity-50" aria-hidden="true" translate="no">eco</span>
                <p>You&apos;ve reached the end of our sustainable catalog.</p>
              </div>
            )}
          </>
        )}
      </div>
      <ComparisonBar />
    </div>
  );
}
