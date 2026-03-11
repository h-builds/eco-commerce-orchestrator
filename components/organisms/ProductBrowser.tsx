"use client";

import { useState, useDeferredValue, useEffect, useCallback, useRef } from 'react';
import { type Product } from '@/components/molecules/ProductCard';
import { SimulatingProductCard } from '@/components/molecules/SimulatingProductCard';
import { SearchBar } from '@/components/molecules/SearchBar';
import { ProductSkeleton } from '@/components/molecules/ProductSkeleton';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

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

export function ProductBrowser({ initialProducts }: ProductBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Infinite Scroll State
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Loading States
  const [isFetchingInitial, setIsFetchingInitial] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const isPendingSearch = searchTerm !== deferredSearchTerm || searchTerm !== debouncedSearchTerm || isFetchingInitial;

  // 1. Debounce the deferred search value
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(deferredSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [deferredSearchTerm]);

  // 2. Fetcher Function
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
        // If we fetched with no search and got nothing, it might be an empty catalog.
        // Otherwise, assess if we hit the limit.
      } else {
        setProducts((prev) => {
          // Prevent duplicates by ID just in case
          const existingIds = new Set(prev.map(p => p.id));
          const appended = newProducts.filter(p => !existingIds.has(p.id));
          return [...prev, ...appended];
        });
      }

      // If we got fewer than our limit (20), we have no more products to load
      setHasMore(newProducts.length === 20);

    } catch (err) {
      console.error('Fetch failed:', err);
      if (isInitial) setProducts([]);
    } finally {
      if (isInitial) setIsFetchingInitial(false);
      else setIsFetchingNextPage(false);
    }
  }, []);

  // 3. Effect for Search Term Changes
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    if (!debouncedSearchTerm.trim()) {
      setOffset(0);
      // If we cleared the search, restore the initial SSR payload instantly
      setProducts(initialProducts);
      setHasMore(initialProducts.length >= 20);
      return;
    }

    // Reset pagination state and fetch fresh
    setOffset(0);
    fetchProducts(debouncedSearchTerm, 0, true);
  }, [debouncedSearchTerm, fetchProducts, initialProducts]);

  // 4. Infinite Scroll Callback
  const loadMore = useCallback(() => {
    if (isFetchingNextPage || isFetchingInitial || !hasMore) return;
    const nextOffset = offset + 20;
    setOffset(nextOffset);
    fetchProducts(debouncedSearchTerm, nextOffset, false);
  }, [offset, isFetchingNextPage, isFetchingInitial, hasMore, debouncedSearchTerm, fetchProducts]);

  const { targetRef } = useIntersectionObserver(loadMore, {
    rootMargin: '400px', // Trigger load slightly before pushing into view
    threshold: 0.1
  });

  return (
    <div className="flex flex-col w-full">
      <div className="sticky top-20 z-20 pb-4 bg-transparent pt-4 -mt-4">
        <SearchBar value={searchTerm} onChange={setSearchTerm} isPending={isPendingSearch} />
      </div>
      
      <div className={`transition-opacity duration-300 ${isPendingSearch ? 'opacity-50' : 'opacity-100'}`}>
        {!products || products.length === 0 ? (
          <div className="p-8 mt-12 text-center text-slate-500 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700" aria-hidden="true">search_off</span>
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
              {products.map((product) => (
                <SimulatingProductCard key={product.id} product={product} />
              ))}
              
              {/* Infinite Scroll Skeletons */}
              {isFetchingNextPage && 
                Array.from({ length: 4 }).map((_, i) => (
                  <ProductSkeleton key={`skeleton-${i}`} />
                ))
              }
            </div>

            {/* Load More Trigger sentinel */}
            {hasMore ? (
              <div ref={targetRef} className="w-full h-20 mt-8 flex items-center justify-center">
                {!isFetchingNextPage && <span className="sr-only">Scroll down to load more products</span>}
              </div>
            ) : (
              <div className="w-full py-12 mt-8 text-center border-t border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-2xl mb-2 inline-block opacity-50" aria-hidden="true">eco</span>
                <p>You&apos;ve reached the end of our sustainable catalog.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
