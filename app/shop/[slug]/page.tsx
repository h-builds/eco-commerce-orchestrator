import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';

import { getProductBySlug, getTopProducts } from '@/lib/db';
import { getLivePrice, getVolatilityData } from '@/lib/pricing';
import { VolatilityChart } from '@/components/molecules/VolatilityChart';
import { PredictivePriceAlert } from '@/components/molecules/PredictivePriceAlert';
import { TechnicalAudit } from '@/components/molecules/TechnicalAudit';
import { BackButton } from '@/components/molecules/BackButton';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const products = await getTopProducts(50);
    return products.map((product) => ({
      slug: product.slug,
    }));
  } catch (e) {
    console.warn("Failed to generate static params", e);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `${product.name} | Live Pricing`,
    description: product.description,
  };
}

async function fetchPriceWithLatency(id: string, price: number, stock: number) {
  const start = Date.now();
  const livePriceData = await getLivePrice(id, price, stock);
  const end = Date.now();
  return { livePriceData, latency: end - start };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const { livePriceData, latency } = await fetchPriceWithLatency(product.id, product.price, product.stock);
  const livePrice = livePriceData.live_price;
  const confidence = livePriceData.agent_confidence;
  const wasmLatency = latency;

  // We wrap the single latency value in a promise so our Client component can consume it with `use`
  const latencyPromise = Promise.resolve(wasmLatency);
  const volatilityPromise = getVolatilityData(product.id, product.price, product.stock);

  return (
    <div className="min-h-screen pt-24 pb-12 w-full flex justify-center">
      <div className="max-w-5xl w-full px-6 md:px-12">
        <BackButton />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Column: Visuals & Chart */}
          <div className="space-y-8">
            <div className="aspect-square relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-8 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {product.image_url ? (
                <Image 
                  src={product.image_url} 
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-48 h-48 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-inner">
                  <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-600">eco</span>
                </div>
              )}
              
              {/* Floating Live Badge */}
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur border border-slate-700 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live: ${(livePrice ?? product.price).toFixed(2)}
              </div>
            </div>

            <Suspense fallback={<div className="h-40 w-full animate-pulse bg-slate-100 dark:bg-slate-900 rounded-2xl" />}>
              <VolatilityChart dataPromise={volatilityPromise} />
            </Suspense>

            <Suspense fallback={<div className="h-40 w-full animate-pulse bg-slate-100 dark:bg-slate-900 rounded-2xl border border-amber-500/30" />}>
              <PredictivePriceAlert currentPrice={livePrice ?? product.price} dataPromise={volatilityPromise} />
            </Suspense>
          </div>

          {/* Right Column: Details & Technical Audit */}
          <div className="flex flex-col justify-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4 w-max">
              <span className="material-symbols-outlined text-sm">category</span>
              {product.category || 'Eco-Friendly'} {/* {product.stock} in stock */}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
              {product.name}
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              {product.description}
            </p>

            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden flex items-center justify-between mb-8 border border-slate-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-1 font-semibold">Current Agent Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">${(livePrice ?? product.price).toFixed(2)}</span>
                  <span className="text-sm font-medium text-slate-400 line-through">${product.price.toFixed(2)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
                  Confidence: {confidence ? (confidence * 100).toFixed(0) : '0'}%
                </div>
              </div>
            </div>

            <TechnicalAudit cacheStatus="ISR (1h)" latencyPromise={latencyPromise} />
          </div>
        </div>
      </div>
    </div>
  );
}
