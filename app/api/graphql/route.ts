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

        return results;
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
