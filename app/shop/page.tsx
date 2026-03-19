import { Suspense } from 'react';
import { ProductGrid } from '@/components/organisms/ProductGrid';
import { PricingStatus } from '@/components/molecules/PricingStatus';
import { SimulationProvider } from '@/lib/SimulationContext';
import { CompareProvider } from '@/lib/CompareContext';
import { ComparisonModal } from '@/components/organisms/ComparisonModal';
import { TelemetryHUD } from '@/components/molecules/TelemetryHUD';
import Loading from './loading';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop eco-friendly products | Eco-Commerce',
  description: 'Sustainable products priced in real-time by our Go Wasm AI agent. Every price reflects live supply & demand.',
  alternates: {
    canonical: '/shop',
  },
};

/**
 * Negotiates real-time pricing via the edge-native Wasm agent. 
 * Seeding is decoupled from standard Edge caching to ensure 
 * deterministic price consistency across distributed stateless workers.
 */
export default function ShopPage() {
  return (
    <SimulationProvider>
      <CompareProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "name": "Shop eco-friendly products",
              "description": "Sustainable products priced in real-time by our Go Wasm AI agent.",
              "url": "https://eco-commerce-orchestrator.pages.dev/shop"
            })
          }}
        />
        <div className="relative flex h-auto w-full flex-col overflow-x-hidden pt-12 px-4 md:px-10 lg:px-20">
          <header className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
              <span className="material-symbols-outlined text-sm" aria-hidden="true">eco</span>
              New Arrivals
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Eco-Friendly Essentials
            </h1>
            <div className="mt-6 max-w-2xl rounded-lg border border-cyan-500/20 bg-slate-900/40 p-4 text-sm leading-relaxed text-slate-300 shadow-inner backdrop-blur-sm font-mono">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">settings_b_roll</span>
                Identity: Deterministic Pricing Orchestrator
              </span>
              <p>
                This is not a price scraper. This is a high-performance calculation engine. We process 10,000+ pricing permutations per second via Go-Wasm to guarantee absolute price integrity across global edge nodes.
              </p>
            </div>
          </header>

          <PricingStatus />

          <section className="mb-20">
            <Suspense fallback={<Loading />}>
              <ProductGrid />
            </Suspense>
          </section>
        </div>
        <ComparisonModal />
        <TelemetryHUD />
      </CompareProvider>
    </SimulationProvider>
  );
}
