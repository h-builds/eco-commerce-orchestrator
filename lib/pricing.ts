"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Fetcher } from "@cloudflare/workers-types";
import { type SimulatedPricing, simulatePrice } from "./pricingEngine";

/**
 * Delegates real-time pricing to the Go-Wasm agent via Cloudflare Service 
 * Bindings. Isolates deterministic calculation load from the Next.js 
 * runtime to ensure sub-millisecond execution for intensive pricing logic.
 */
export async function getLivePrice(productId: string, basePrice: number, stock: number): Promise<SimulatedPricing> {
  const env = (await getCloudflareContext({ async: true })).env as unknown as {
    PRICING_AGENT?: Fetcher;
    INTERNAL_SECRET?: string;
  };

  if (!env.PRICING_AGENT) {
    return { live_price: basePrice, agent_confidence: 0 };
  }

  try {
    const res = await env.PRICING_AGENT.fetch("http://pricing-agent/rpc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.INTERNAL_SECRET}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "calculate_price",
        params: [{ product_id: productId, base_price: basePrice, stock }],
        id: "single",
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { 
        result?: { live_price: number; agent_confidence: number }[]; 
      };
      if (data?.result && data.result.length > 0) {
        return {
          live_price: data.result[0].live_price,
          agent_confidence: data.result[0].agent_confidence,
        };
      }
    }
  } catch (e) {
    console.error("Error fetching from pricing agent:", e);
  }

  return { live_price: basePrice, agent_confidence: 0 };
}

/**
 * Dispatches a batch of products to the Go-Wasm agent concurrently.
 * Used for bypassing Cloudflare CPU time limits via parallel fan-out.
 */
export async function batchLivePrices(products: { id: string; price: number; stock: number }[]): Promise<{ id: string; live_price: number; agent_confidence: number }[]> {
  const env = (await getCloudflareContext({ async: true })).env as unknown as {
    PRICING_AGENT?: Fetcher;
    INTERNAL_SECRET?: string;
  };

  if (!env.PRICING_AGENT) {
    return products.map((p) => ({
      id: p.id,
      live_price: p.price,
      agent_confidence: 0,
    }));
  }

  try {
    const res = await env.PRICING_AGENT.fetch("http://pricing-agent/rpc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.INTERNAL_SECRET}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "calculate_price",
        params: products.map((p) => ({
          product_id: p.id,
          base_price: p.price,
          stock: p.stock,
        })),
        id: "batch-dispatch",
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        result?: { product_id: string; live_price: number; agent_confidence: number }[];
      };
      if (data?.result && Array.isArray(data.result)) {
        return data.result.map((r) => ({
          id: r.product_id,
          live_price: r.live_price,
          agent_confidence: r.agent_confidence,
        }));
      }
    } else {
       console.warn(`batchLivePrices Wasm fetch failed: status ${res.status}`);
    }
  } catch (e) {
    console.error("Error fetching from pricing agent in batchLivePrices:", e);
  }

  return products.map((p) => ({
    id: p.id,
    live_price: p.price,
    agent_confidence: 0,
  }));
}


/**
 * Generates deterministic 24-hour volatility curves. Utilizes the local 
 * JS-port to avoid batching/round-trip overhead for high-cardinality 
 * projection arrays.
 */
export async function getVolatilityData(productId: string, basePrice: number, stock: number): Promise<{ hour: number; price: number; confidence: number }[]> {
  const data: {hour: number; price: number; confidence: number}[] = [];
  for (let i = 0; i < 24; i++) {
    const res = simulatePrice(productId, basePrice, stock, i);
    data.push({ hour: i, price: res.live_price, confidence: res.agent_confidence });
  }
  return data;
}
