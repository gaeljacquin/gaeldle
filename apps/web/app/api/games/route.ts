// When q is present, ORDER BY uses similarity() from the pg_trgm extension (GIN index: game_name_trgm_idx)
import { NextRequest, NextResponse } from 'next/server';
import { asc, desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { games, gameObject } from '@gaeldle/api-contract';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.max(1, Number(searchParams.get('pageSize') ?? 10));
    const q = searchParams.get('q') ?? undefined;
    const sortBy = (searchParams.get('sortBy') ?? 'name') as 'name' | 'firstReleaseDate' | 'igdbId';
    const sortDir = (searchParams.get('sortDir') ?? 'asc') as 'asc' | 'desc';

    const offset = (page - 1) * pageSize;
    const where = q ? sql`name ILIKE ${'%' + q + '%'}` : undefined;

    const orderBy = (() => {
      if (q) {
        return sql`similarity(name, ${q}) DESC`;
      }
      if (sortBy === 'firstReleaseDate') {
        return sortDir === 'asc'
          ? sql`first_release_date ASC NULLS LAST`
          : sql`first_release_date DESC NULLS LAST`;
      }
      const col = sortBy === 'igdbId' ? games.igdbId : games.name;
      return sortDir === 'asc' ? asc(col) : desc(col);
    })();

    const [gamesList, totalCount] = await Promise.all([
      db.select(gameObject).from(games).where(where).limit(pageSize).offset(offset).orderBy(orderBy),
      db.select({ count: sql<number>`count(*)` }).from(games).where(where),
    ]);

    const total = Number(totalCount[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: gamesList,
      meta: { page, pageSize, total },
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Connection failed. Please try again later.'
      },
      { status: 500 }
    );
  }
}
