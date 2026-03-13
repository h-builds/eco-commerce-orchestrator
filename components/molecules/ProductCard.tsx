"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { useCompare } from "@/lib/CompareContext";

/**
 * Core domain model for catalog entities. Synchronizes Edge-verified 
 * live pricing telemetry with D1-persisted static attributes.
 */
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  live_price: number;
  agent_confidence: number;
  category: string;
  stock: number;
  rating: number;
  image_url: string;
}

interface ProductCardProps {
  product: Product;
  isSimulating?: boolean;
  /** LCP optimization for above-the-fold catalog assets. */
  priority?: boolean;
}

/**
 * Employs a strict memoization boundary to isolate the document tree from 
 * high-concurrency simulation cycles, preserving 60 FPS scrolling stability 
 * during Go-Wasm seed propagation.
 */
function ProductCardBase({ product, isSimulating = false, priority = false }: ProductCardProps) {
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const formattedPrice = `$${product.live_price.toFixed(2)}`;
  const formattedOriginalPrice = `$${product.price.toFixed(2)}`;
  const hasPriceChanged = product.price !== product.live_price;
  const formattedRating = product.rating.toFixed(1);
  const confidencePercent = Math.round(product.agent_confidence * 100);

  const { selectedProducts, toggleProduct } = useCompare();
  const isSelected = selectedProducts.some((p) => p.id === product.id);
  const canSelectMore = selectedProducts.length < 3;

  const confidenceColor =
    confidencePercent >= 90
      ? "bg-emerald-500 text-white"
      : confidencePercent >= 75
        ? "bg-amber-500 text-white"
        : "bg-rose-500 text-white";

  const verifiedBadgeClass = isSimulating
    ? "mt-1 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
    : "mt-1 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 animate-pulse";

  const verifiedDotClass = isSimulating
    ? "size-1.5 rounded-full bg-amber-400 shrink-0"
    : "size-1.5 rounded-full bg-emerald-400 shrink-0";

  const verifiedLabel = isSimulating
    ? "Price seeded by simulated hour"
    : "Price verified by Go-Wasm edge agent";

  const verifiedText = isSimulating
    ? "Sim: Go-Wasm Seed"
    : "Live: Go-Wasm Verified";

  return (
    <article
      className="group relative flex flex-col bg-white/5 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 hover:scale-[1.02] hover:border-emerald-500/50 hover:bg-white/10 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 ease-in-out focus-within:ring-4 focus-within:ring-primary/20"
      aria-label={`View details for ${product.name}`}>
      <div className="relative h-64 w-full block bg-slate-100 dark:bg-slate-800 overflow-hidden outline-none">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          priority={priority}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <button
          className={`absolute top-4 right-4 z-20 flex size-8 items-center justify-center rounded-full  transition-all focus:outline-none focus-visible:ring-4 ${
            isSelected
              ? "bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500/30"
              : "bg-white/80 dark:bg-slate-900/80 text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-900 focus-visible:ring-emerald-500/30 backdrop-blur"
          } ${
            !isSelected && !canSelectMore
              ? "opacity-50 cursor-not-allowed hidden group-hover:flex"
              : "hidden group-hover:flex"
          } md:flex`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleProduct(product);
          }}
          aria-label={
            isSelected
              ? `Remove ${product.name} from comparison`
              : `Add ${product.name} to comparison`
          }
          title={
            isSelected
              ? "Remove from comparison"
              : canSelectMore
                ? "Compare"
                : "Comparison limit reached"
          }>
          <span
            className="material-symbols-outlined text-sm font-bold"
            aria-hidden="true">
            {isSelected ? "check" : "compare_arrows"}
          </span>
        </button>

        {isLowStock && (
          <span
            className="absolute top-4 left-4 bg-amber-400 text-slate-900 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm"
            role="status"
            aria-label={`Low stock warning for ${product.name}`}>
            Low Stock
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-emerald-500 transition-colors">
            <Link href={`/shop/${product.slug}`} prefetch={false} className="before:absolute before:inset-0 before:z-10 focus:outline-none">
              {product.name}
            </Link>
          </h3>
          <div
            className="flex flex-col items-end shrink-0"
            role="region"
            aria-label={`Live Price: ${formattedPrice}`}>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-lg">
              {formattedPrice}
            </span>
            {hasPriceChanged && (
              <span
                className="text-xs text-slate-500 line-through"
                aria-label={`Original Price: ${formattedOriginalPrice}`}>
                {formattedOriginalPrice}
              </span>
            )}
            <span className={verifiedBadgeClass} aria-label={verifiedLabel}>
              <span className={verifiedDotClass} aria-hidden="true" />
              {verifiedText}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 ${confidenceColor}`}
            aria-label={`AI Pricing Agent Confidence: ${confidencePercent}%`}>
            <span
              className="material-symbols-outlined text-[10px]"
              aria-hidden="true">
              auto_awesome
            </span>
            AI Price • {confidencePercent}%
          </span>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 flex-1">
          {product.description}
        </p>

        <div
          className="flex items-center gap-1 mt-2 text-amber-400"
          aria-label={`Rating: ${formattedRating} out of 5 stars in ${product.category}`}>
          <span
            className="material-symbols-outlined text-sm"
            aria-hidden="true">
            star
          </span>
          <span
            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            aria-hidden="true">
            {formattedRating}
          </span>
          <span className="text-xs text-slate-500 ml-1" aria-hidden="true">
            ({product.category})
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 relative">
          <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 border border-emerald-500/20">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm animate-pulse" aria-hidden="true">
                query_stats
              </span>
              Analyze Edge Pricing
            </span>
            <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1" aria-hidden="true">
              arrow_forward
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/** 
 * Locks the catalog grid against high-frequency temporal state 
 * fluctuations to ensure deterministic UI response times.
 */
export const ProductCard = memo(
  ProductCardBase,
  (prev, next) =>
    prev.isSimulating === next.isSimulating && prev.product === next.product,
);
