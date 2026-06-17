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

export const PricingResultItemSchema = z.object({
  product_id: z.string().optional(),
  live_price: z.number(),
  agent_confidence: z.number(),
});

export type PricingResultItemDTO = z.infer<typeof PricingResultItemSchema>;

export const PricingResponseSchema = z.object({
  result: z.array(PricingResultItemSchema).optional(),
});

export type PricingResponseDTO = z.infer<typeof PricingResponseSchema>;

export const BenchmarkingResponseSchema = z.object({
  result: z.array(z.unknown()).optional(),
  internal_exec_time_us: z.number().optional(),
});

export type BenchmarkingResponseDTO = z.infer<typeof BenchmarkingResponseSchema>;

export const SearchGraphQLResponseSchema = z.object({
  data: z.object({
    products: z.array(ProductSchema).optional()
  }).optional(),
  errors: z.array(z.object({ message: z.string() })).optional()
});

export type SearchGraphQLResponseDTO = z.infer<typeof SearchGraphQLResponseSchema>;
