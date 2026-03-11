import { SimulatingProductCard } from '@/components/molecules/SimulatingProductCard';
import { type Product } from '@/components/molecules/ProductCard';
import { graphql } from 'graphql';
import { schema } from '@/app/api/graphql/route';

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
 *
 * Renders SimulatingProductCard (a 'use client' component) so that
 * the memoised ProductCard can receive the simulation flag from
 * SimulationContext without polluting the RSC boundary.
 */
export async function ProductGrid() {
  try {
    const result = await graphql({
      schema,
      source: GET_PRODUCTS_QUERY,
    });

    if (result.errors?.length) {
      console.error('GraphQL Execution Errors:', result.errors);
      return (
        <div className="p-8 bg-red-50 dark:bg-red-900/10 border border-red-500 rounded-xl" role="alert">
          <p className="text-red-600 font-bold flex items-center gap-2">
            <span className="material-symbols-outlined" aria-hidden="true">error</span>
            Failed to load products. Please try again later.
          </p>
        </div>
      );
    }

    const { data } = result as unknown as { data?: { products: Product[] } };
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
        // Spread into a plain object: D1 row objects have a non-null prototype
        // which React's RSC→Client serializer rejects when crossing to a
        // 'use client' component. `{...product}` creates a serializable POJO.
        <SimulatingProductCard key={product.id} product={{ ...product }} />
      ))}
    </div>
  );
  } catch (error) {
    console.error('Failed to execute GraphQL query:', error);
    return (
      <div className="p-8 bg-red-50 dark:bg-red-900/10 border border-red-500 rounded-xl" role="alert">
        <p className="text-red-600 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined" aria-hidden="true">error</span>
          Failed to load products. Please try again later.
        </p>
      </div>
    );
  }
}
