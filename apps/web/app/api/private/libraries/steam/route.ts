import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { games, gameObject } from '@workspace/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filter = searchParams.get('filter'); // 'all' | 'owned' | 'demos'

    let whereClause = or(eq(games.steam, true), eq(games.steamDemo, true));

    if (filter === 'owned') {
      whereClause = and(
        eq(games.steam, true),
        or(eq(games.steamDemo, false), isNull(games.steamDemo)),
      );
    } else if (filter === 'demos') {
      whereClause = eq(games.steamDemo, true);
    }

    const data = await db
      .select(gameObject)
      .from(games)
      .where(whereClause)
      .orderBy(games.name);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching Steam library:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Steam library' },
      { status: 500 },
    );
  }
}
