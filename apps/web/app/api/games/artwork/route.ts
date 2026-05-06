import { NextResponse } from 'next/server';
import { and, desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { games, gameObject } from '@workspace/api-contract';

export async function GET() {
  const gamesList = await db
    .select(gameObject)
    .from(games)
    .where(and(sql`artworks IS NOT NULL`, sql`json_array_length(artworks) > 0`))
    .orderBy(desc(games.id));

  return NextResponse.json({ success: true, data: gamesList });
}
