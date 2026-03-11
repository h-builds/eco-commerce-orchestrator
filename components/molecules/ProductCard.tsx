import Image from 'next/image';
import Link from 'next/link';

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

export function ProductCard({ product }: { product: Product }) {
  // Pure functional component (React Compiler target)
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const formattedPrice = `$${product.live_price.toFixed(2)}`;
  const formattedOriginalPrice = `$${product.price.toFixed(2)}`;
  const hasPriceChanged = product.price !== product.live_price;
  const formattedRating = product.rating.toFixed(1);
  const confidencePercent = Math.round(product.agent_confidence * 100);

  // Determine confidence badge color — ternary keeps the compiler's
  // memoization path clean and removes the misleading dead-code default.
  const confidenceColor =
    confidencePercent >= 90 ? "bg-emerald-500 text-white"
    : confidencePercent >= 75 ? "bg-amber-500 text-white"
    : "bg-rose-500 text-white";

  return (
    <article className="group flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow focus-within:ring-4 focus-within:ring-primary/20">
      <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden="true" className="relative h-64 w-full block bg-slate-100 dark:bg-slate-800 overflow-hidden outline-none">
        <Image 
          src={product.image_url} 
          alt={`Image of ${product.name}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        {isLowStock && (
          <span
            className="absolute top-4 left-4 bg-amber-400 text-slate-900 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm"
            role="status"
            aria-label={`Low stock warning for ${product.name}`}
          >
            Low Stock
          </span>
        )}
      </Link>
      
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-4">
          <Link 
            href={`/products/${product.slug}`} 
            className="outline-none focus-visible:underline decoration-2 decoration-primary underline-offset-4 rounded"
            aria-label={`View details for ${product.name}`}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="flex flex-col items-end shrink-0" role="region" aria-label={`Live Price: ${formattedPrice}`}>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-lg">
              {formattedPrice}
            </span>
            {hasPriceChanged && (
              <span className="text-xs text-slate-500 line-through" aria-label={`Original Price: ${formattedOriginalPrice}`}>
                {formattedOriginalPrice}
              </span>
            )}
            {/* Go-Wasm verification badge */}
            <span
              className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 animate-pulse"
              aria-label="Price verified by Go-Wasm edge agent"
            >
              <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
              Live: Go-Wasm Verified
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 ${confidenceColor}`}
            aria-label={`AI Pricing Agent Confidence: ${confidencePercent}%`}
          >
            <span className="material-symbols-outlined text-[10px]" aria-hidden="true">
              auto_awesome
            </span>
            AI Price • {confidencePercent}%
          </span>
        </div>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 flex-1">
          {product.description}
        </p>
        
        <div className="flex items-center gap-1 mt-2 text-amber-400" aria-label={`Rating: ${formattedRating} out of 5 stars in ${product.category}`}>
          <span className="material-symbols-outlined text-sm" aria-hidden="true">star</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300" aria-hidden="true">
            {formattedRating}
          </span>
          <span className="text-xs text-slate-500 ml-1" aria-hidden="true">
            ({product.category})
          </span>
        </div>
        
        <button
          className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:brightness-110 active:scale-95 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          aria-label={isOutOfStock ? `Out of stock: ${product.name}` : `Add ${product.name} to cart`}
          disabled={isOutOfStock}
        >
          <span className="material-symbols-outlined text-sm" aria-hidden="true">
            {isOutOfStock ? 'remove_shopping_cart' : 'shopping_cart'}
          </span>
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
