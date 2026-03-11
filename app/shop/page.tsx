import { Suspense } from 'react';
import { ProductGrid } from '@/components/organisms/ProductGrid';
import Loading from './loading';

export const runtime = 'edge';

export default function ShopPage() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pt-12">
      <div className="mx-auto max-w-6xl w-full px-4 md:px-10">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">eco</span>
            New Arrivals
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Eco-Friendly Essentials
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Discover our carefully curated selection of sustainable products designed to reduce your carbon footprint without compromising on quality or aesthetics.
          </p>
        </header>

        <main className="mb-20">
          <Suspense fallback={<Loading />}>
            <ProductGrid />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
