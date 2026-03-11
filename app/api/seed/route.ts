import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/db/seed';
import type { D1Database } from '@cloudflare/workers-types';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SEED_SECRET || 'dev-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = process.env.ECO_DB as unknown as D1Database;
    if (!db) {
      return NextResponse.json({ error: 'Database binding ECO_DB is missing' }, { status: 500 });
    }

    const result = await seedDatabase(db);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Internal server error during seeding' },
      { status: 500 }
    );
  }
}
