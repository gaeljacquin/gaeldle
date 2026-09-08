// When q is present, ORDER BY uses similarity() from the pg_trgm extension (GIN index: game_name_trgm_idx)
import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { games, gameObject } from '@workspace/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.max(1, Number(searchParams.get('pageSize') ?? 10));
    const q = searchParams.get('q') ?? undefined;
    const igdbId = searchParams.get('igdbId') ?? undefined;

    const sortBy = (searchParams.get('sortBy') ?? 'name') as
      'name' | 'firstReleaseDate' | 'igdbId' | 'createdAt';

    const sortDir = (searchParams.get('sortDir') ?? 'asc') as 'asc' | 'desc';
    const offset = (page - 1) * pageSize;

    const where = and(
      eq(games.steamWishlist, true),
      q ? sql`name ILIKE ${'%' + q + '%'}` : undefined,
      igdbId ? sql`igdb_id::text ILIKE ${'%' + igdbId + '%'}` : undefined,
    );

    const orderBy = (() => {
      if (q) {
        return sql`similarity(name, ${q}) DESC`;
      }

      if (sortBy === 'firstReleaseDate') {
        return sortDir === 'asc'
          ? sql`first_release_date ASC NULLS LAST`
          : sql`first_release_date DESC NULLS LAST`;
      }

      if (sortBy === 'createdAt') {
        return sortDir === 'asc' ? asc(games.createdAt) : desc(games.createdAt);
      }

      const col = sortBy === 'igdbId' ? games.igdbId : games.name;

      return sortDir === 'asc' ? asc(col) : desc(col);
    })();

    const [gamesList, totalCount] = await Promise.all([
      db
        .select(gameObject)
        .from(games)
        .where(where)
        .limit(pageSize)
        .offset(offset)
        .orderBy(orderBy),
      db
        .select({ count: sql<number>`count(*)` })
        .from(games)
        .where(where),
    ]);

    const total = Number(totalCount[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: gamesList,
      meta: { page, pageSize, total },
    });
  } catch (error) {
    console.error('Error fetching Steam wishlist:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Steam wishlist',
      },
      { status: 500 },
    );
  }
}
