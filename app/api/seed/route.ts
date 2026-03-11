import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "@/lib/db/seed";
import { getRequestContext } from "@cloudflare/next-on-pages"; // Importación vital

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    // 1. Acceder al contexto de Cloudflare
    const { env } = getRequestContext();

    // 2. Validar existencia del secreto (Sin fallbacks inseguros)
    const SEED_SECRET = env.SEED_SECRET;
    if (!SEED_SECRET) {
      console.error(
        "CRITICAL_AUTH_ERROR: SEED_SECRET is not defined in environment.",
      );
      return NextResponse.json(
        { error: "Internal configuration error" },
        { status: 500 },
      );
    }

    // 3. Verificación de autorización
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${SEED_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 4. Obtener binding de D1 desde el contexto
    const db = env.ECO_DB;
    if (!db) {
      return NextResponse.json(
        { error: "Infrastructure error: ECO_DB binding missing" },
        { status: 500 },
      );
    }

    const result = await seedDatabase(db);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error(
      "Seeding failure:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Internal server error during seeding" },
      { status: 500 },
    );
  }
}
