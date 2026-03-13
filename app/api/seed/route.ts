// app/api/seed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "@/lib/db/seed";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

/**
 * Secret-validated entrypoint for transactional D1 hydration. 
 * Orchestrates cold-start state initialization to optimize deployment 
 * velocity by bypassing manual console-level operations.
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getCloudflareContext({ async: true });
    const env = context.env as unknown as {
      eco_db: D1Database;
      SEED_SECRET: string | undefined;
    };

    const SEED_SECRET = env.SEED_SECRET;
    if (!SEED_SECRET) {
      console.error("CRITICAL: SEED_SECRET missing in environment.");
      return NextResponse.json({ error: "Config error" }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${SEED_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = env.eco_db;
    if (!db) {
      return NextResponse.json(
        { error: "ECO_DB binding missing" },
        { status: 500 },
      );
    }

    const result = await seedDatabase(db);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Seeding failure:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
