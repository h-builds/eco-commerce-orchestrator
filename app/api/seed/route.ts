// app/api/seed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "@/lib/db/seed";
import { getRequestContext } from "@cloudflare/next-on-pages";
import type { D1Database } from "@cloudflare/workers-types";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const context = getRequestContext();
    const env = context.env as unknown as {
      eco_db: D1Database; // ✅ Cambiado a minúsculas para coincidir con wrangler.toml
      SEED_SECRET: string | undefined;
    };

    const SEED_SECRET = env.SEED_SECRET;

    // Validación de seguridad
    if (!SEED_SECRET) {
      console.error("CRITICAL: SEED_SECRET missing in environment.");
      return NextResponse.json({ error: "Config error" }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${SEED_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Usar el binding correcto
    const db = env.eco_db; // ✅ Sincronizado
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
