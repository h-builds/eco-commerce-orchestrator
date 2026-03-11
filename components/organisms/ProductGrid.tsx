import { ProductCard, type Product } from '@/components/molecules/ProductCard';

const GET_PRODUCTS_QUERY = `
  query GetFirstProducts {
    products(limit: 20) {
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

/**
 * ProductGrid — async RSC.
 * The Suspense boundary lives one level up in app/shop/page.tsx,
 * so this component simply awaits its data and renders. No inner
 * Suspense wrapper needed; throwing a Promise here bubbles correctly
 * to the route-level boundary and its <Loading /> fallback.
 */
export async function ProductGrid() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: GET_PRODUCTS_QUERY }),
    cache: 'no-store', // always fetch fresh live prices
  });

  if (!res.ok) {
    console.error('GraphQL fetch failed:', res.status, res.statusText);
    return (
      <div className="p-8 bg-red-50 dark:bg-red-900/10 border border-red-500 rounded-xl" role="alert">
        <p className="text-red-600 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined" aria-hidden="true">error</span>
          Failed to load products. Please try again later.
        </p>
      </div>
    );
  }

  const { data, errors } = (await res.json()) as {
    data?: { products: Product[] };
    errors?: { message: string }[];
  };

  if (errors?.length) {
    console.error('GraphQL Execution Errors:', errors);
    return (
      <div className="p-8 bg-red-50 dark:bg-red-900/10 border border-red-500 rounded-xl" role="alert">
        <p className="text-red-600 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined" aria-hidden="true">error</span>
          Failed to load products. Please try again later.
        </p>
      </div>
    );
  }

  const products = data?.products ?? null;

  if (!products || products.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-4xl" aria-hidden="true">inventory_2</span>
        <p>No products found in the catalog.</p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
      role="region"
      aria-label="Product Catalog"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
