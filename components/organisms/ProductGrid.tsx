import { execute, parse } from 'graphql';
import { schema } from '@/app/api/graphql/route';
import { ProductCard, type Product } from '@/components/molecules/ProductCard';

const GET_PRODUCTS = parse(`
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
`);

export async function ProductGrid() {
  const result = await execute({
    schema,
    document: GET_PRODUCTS,
  });

  if (result.errors) {
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

  const products = result.data?.products as Product[] | null;

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
