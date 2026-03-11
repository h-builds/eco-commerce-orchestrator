import { createSchema, createYoga } from "graphql-yoga";
import { NextRequest } from "next/server";
import type { D1Database, Fetcher } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const typeDefs = /* GraphQL */ `
  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String!
    price: Float!
    live_price: Float!
    agent_confidence: Float!
    category: String!
    stock: Int!
    rating: Float!
    image_url: String!
  }

  type Query {
    products(limit: Int, offset: Int, category: String): [Product!]!
  }
`;

const resolvers = {
  Query: {
    products: async (
      _: unknown,
      {
        limit = 50,
        offset = 0,
        category,
      }: { limit?: number; offset?: number; category?: string },
    ) => {
      // Access Cloudflare D1 Binding via getRequestContext (next-on-pages standard)
      const env = (await getCloudflareContext({ async: true })).env as unknown as {
        eco_db: D1Database;
        PRICING_AGENT?: Fetcher;   // Optional — only present when eco-pricing-agent Worker is deployed
        INTERNAL_SECRET?: string;
      };
      const db = env.eco_db;

      if (!db) {
        throw new Error("Database connection is not configured.");
      }

      try {
        let query = "SELECT * FROM products";
        const params: (string | number)[] = [];

        if (category) {
          query += " WHERE category = ?";
          params.push(category);
        }

        const finalLimit = Math.max(1, Math.min(50, Math.floor(limit)));
        const finalOffset = Math.max(0, Math.floor(offset));

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(finalLimit, finalOffset);

        const { results, success } = await db
          .prepare(query)
          .bind(...params)
          .all();

        if (!success) {
          throw new Error("Failed to fetch products");
        }

        // --- Call the Go Dynamic Pricing Agent ---
        // Fetch real-time prices for each product via the Wasm-powered JSON-RPC interface
        interface DBProduct {
          id: string;
          price: number;
          stock: number;
          [key: string]: unknown;
        }

        const pricingRequests = (results as DBProduct[]).map((p) => ({
          product_id: p.id,
          base_price: p.price,
          stock: p.stock,
        }));

        const pricingMap: Record<
          string,
          { live_price: number; agent_confidence: number }
        > = {};

        try {
          if (pricingRequests.length > 0 && env.PRICING_AGENT) {
            const maxRetries = 3;
            const baseDelayMs = 100;
            let attempt = 0;
            let pricingSucceeded = false;

            while (attempt < maxRetries && !pricingSucceeded) {
              try {
                const res = await env.PRICING_AGENT.fetch(
                  "http://pricing-agent/rpc",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${env.INTERNAL_SECRET}`,
                    },
                    body: JSON.stringify({
                      jsonrpc: "2.0",
                      method: "calculate_price",
                      params: pricingRequests,
                      id: "batch",
                    }),
                  },
                );

                if (res.ok) {
                  const data = (await res.json()) as {
                    result?: {
                      product_id: string;
                      live_price: number;
                      agent_confidence: number;
                    }[];
                  };
                  if (data?.result && Array.isArray(data.result)) {
                    for (const pr of data.result) {
                      pricingMap[pr.product_id] = {
                        live_price: pr.live_price,
                        agent_confidence: pr.agent_confidence,
                      };
                    }
                  }
                  pricingSucceeded = true;
                } else {
                  throw new Error(
                    `Pricing agent returned non-ok status: ${res.status}`,
                  );
                }
              } catch (innerErr) {
                attempt++;
                console.warn(`Pricing agent fetch attempt ${attempt} failed:`, innerErr);
                if (attempt >= maxRetries) throw innerErr;
                await new Promise((resolve) =>
                  setTimeout(resolve, baseDelayMs * Math.pow(2, attempt - 1)),
                );
              }
            }
          }
        } catch (err) {
          // Fall back to base price and emit a structured log for Cloudflare Logpush / Workers Tail.
          console.error(
            JSON.stringify({
              event: "pricing_agent_failure",
              error: String(err),
              productCount: pricingRequests.length,
              timestamp: new Date().toISOString(),
            }),
          );
        }

        const productsWithLivePrices = (results as DBProduct[]).map((p) => {
          const liveData = pricingMap[p.id] || {
            live_price: p.price,
            agent_confidence: 0.0,
          };
          return {
            ...p,
            live_price: liveData.live_price,
            agent_confidence: liveData.agent_confidence,
          };
        });

        return productsWithLivePrices;
      } catch (e) {
        console.error("Resolver error:", e);
        throw new Error(`Internal Server Error fetching products: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  },
};

export const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response: globalThis.Response },
});

// Next.js App Router context type
interface NextContext {
  params: Promise<Record<string, string>>;
}

export async function GET(request: NextRequest, ctx: NextContext) {
  return yoga.handleRequest(request, ctx as unknown as Record<string, unknown>);
}

export async function POST(request: NextRequest, ctx: NextContext) {
  return yoga.handleRequest(request, ctx as unknown as Record<string, unknown>);
}

export async function OPTIONS(request: NextRequest, ctx: NextContext) {
  return yoga.handleRequest(request, ctx as unknown as Record<string, unknown>);
}
