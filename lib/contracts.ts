import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string(),
  stock: z.number(),
  rating: z.number(),
  image_url: z.string(),
  live_price: z.number(),
  agent_confidence: z.number(),
});

export type ProductDTO = z.infer<typeof ProductSchema>;

const PricingResultItemSchema = z.object({
  product_id: z.string().optional(),
  live_price: z.number(),
  agent_confidence: z.number(),
});



export const PricingResponseSchema = z.object({
  result: z.array(PricingResultItemSchema).optional(),
});



export const BenchmarkingResponseSchema = z.object({
  result: z.array(z.unknown()).optional(),
  internal_exec_time_us: z.number().optional(),
});



export const SearchGraphQLResponseSchema = z.object({
  data: z.object({
    products: z.array(ProductSchema).optional()
  }).optional(),
  errors: z.array(z.object({ message: z.string() })).optional()
});


