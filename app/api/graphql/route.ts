import { createSchema, createYoga } from "graphql-yoga";
import { NextRequest } from "next/server";
import type { D1Database } from "@cloudflare/workers-types";

export const runtime = "edge";

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
      // Access Cloudflare D1 Binding
      // In a Next.js Edge environment hosted on Cloudflare Pages, bindings are often
      // exposed on process.env (or next req.ext context). We'll access it directly.
      const db = (process.env as unknown as { ECO_DB: D1Database }).ECO_DB;

      if (!db) {
        console.error("Database binding ECO_DB is missing");
        throw new Error("Database connection is not configured.");
      }

      try {
        let query = "SELECT * FROM products";
        const params: (string | number)[] = [];

        if (category) {
          query += " WHERE category = ?";
          params.push(category);
        }

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(limit, offset);

        const { results, success, error } = await db
          .prepare(query)
          .bind(...params)
          .all();

        if (!success) {
          console.error("Failed to execute D1 query:", error);
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

        const productsWithLivePrices = await Promise.all(
          (results as DBProduct[]).map(async (p) => {
            let livePrice = p.price;
            let agentConfidence = 0.0;

            try {
              // Hitting the local binding or dev server of the Workers Go service
              const res = await fetch("http://127.0.0.1:8787/rpc", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer eco-orchestrator-internal",
                },
                body: JSON.stringify({
                  jsonrpc: "2.0",
                  method: "calculate_price",
                  params: [
                    {
                      product_id: p.id,
                      base_price: p.price,
                      stock: p.stock,
                    },
                  ],
                  id: p.id,
                }),
              });

              if (res.ok) {
                const data = (await res.json()) as {
                  result?: { live_price: number; agent_confidence: number };
                };
                if (data && data.result) {
                  livePrice = data.result.live_price;
                  agentConfidence = data.result.agent_confidence;
                }
              } else {
                console.warn("Pricing agent returned non-ok status:", res.status);
              }
            } catch (err) {
              console.warn("Failed to reach pricing agent, falling back to original price.", err);
            }

            return {
              ...p,
              live_price: livePrice,
              agent_confidence: agentConfidence,
            };
          }),
        );

        return productsWithLivePrices;
      } catch (e: unknown) {
        console.error("Error fetching products from D1:", e);
        throw new Error("Internal Server Error fetching products");
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
