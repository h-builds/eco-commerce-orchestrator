import { createSchema, createYoga } from 'graphql-yoga';
import { NextRequest } from 'next/server';
import type { D1Database } from '@cloudflare/workers-types';

export const runtime = 'edge';

// Extend process.env type for Cloudflare binding
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ECO_DB: D1Database;
    }
  }
}

const typeDefs = `
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
      _: any,
      { limit = 50, offset = 0, category }: { limit?: number; offset?: number; category?: string },
      context: any
    ) => {
      // Access Cloudflare D1 Binding
      // In a Next.js Edge environment hosted on Cloudflare Pages, bindings are often
      // exposed on process.env (or next req.ext context). We'll access it directly.
      const db = process.env.ECO_DB as unknown as D1Database;

      if (!db) {
        console.error('Database binding ECO_DB is missing');
        throw new Error('Database connection is not configured.');
      }

      try {
        let query = 'SELECT * FROM products';
        const params: any[] = [];

        if (category) {
          query += ' WHERE category = ?';
          params.push(category);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const { results, success, error } = await db.prepare(query).bind(...params).all();

        if (!success) {
          console.error('Failed to execute D1 query:', error);
          throw new Error('Failed to fetch products');
        }

        return results;
      } catch (e: any) {
        console.error('Error fetching products from D1:', e);
        throw new Error('Internal Server Error fetching products');
      }
    },
  },
};

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response: globalThis.Response },
});

export async function GET(request: NextRequest, ctx: any) {
  return yoga.handleRequest(request, ctx);
}

export async function POST(request: NextRequest, ctx: any) {
  return yoga.handleRequest(request, ctx);
}

export async function OPTIONS(request: NextRequest, ctx: any) {
  return yoga.handleRequest(request, ctx);
}
