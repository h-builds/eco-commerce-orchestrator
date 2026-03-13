import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";
import type { Product } from "@/components/molecules/ProductCard";

/**
 * Resolves the D1 database binding via OpenNext's Cloudflare context. 
 * Bridges the Next.js edge runtime directly to the persistence layer 
 * without Node.js polyfill overhead.
 */
export async function getDb(): Promise<D1Database> {
  const env = (await getCloudflareContext({ async: true })).env as unknown as {
    eco_db: D1Database;
  };
  if (!env.eco_db) throw new Error("Database connection is not configured.");
  return env.eco_db;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = await getDb();
  const { results } = await db.prepare("SELECT * FROM products WHERE slug = ?").bind(slug).all();
  return results.length > 0 ? (results[0] as unknown as Product) : null;
}

export async function getTopProducts(limit: number): Promise<Product[]> {
  const db = await getDb();
  const { results } = await db.prepare("SELECT * FROM products ORDER BY rating DESC LIMIT ?").bind(limit).all();
  return results as unknown as Product[];
}
