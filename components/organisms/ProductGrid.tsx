import { ProductBrowser } from '@/components/organisms/ProductBrowser';
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
 * Direct GraphQL resolution against the Edge D1 database. Suspense boundaries 
 * are managed at the layout level to optimize streaming hydration and 
 * unblock TTFB.
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
            <span className="material-symbols-outlined notranslate" aria-hidden="true" translate="no">error</span>
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
        <span className="material-symbols-outlined notranslate text-4xl" aria-hidden="true" translate="no">inventory_2</span>
        <p>No products found in the catalog.</p>
      </div>
    );
  }

  const serializableProducts = products.map((product) => ({ ...product }));

  return <ProductBrowser initialProducts={serializableProducts} />;
  } catch (error) {
    console.error('Failed to execute GraphQL query:', error);
    return (
      <div className="p-8 bg-red-50 dark:bg-red-900/10 border border-red-500 rounded-xl" role="alert">
        <p className="text-red-600 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined notranslate" aria-hidden="true" translate="no">error</span>
          Failed to load products. Please try again later.
        </p>
      </div>
    );
  }
}
