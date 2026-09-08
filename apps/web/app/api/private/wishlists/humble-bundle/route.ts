// When q is present, ORDER BY uses similarity() from the pg_trgm extension (GIN index: game_name_trgm_idx)
import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { games, gameObject } from '@workspace/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const q = searchParams.get('q') ?? undefined;
    const igdbId = searchParams.get('igdbId') ?? undefined;

    const sortBy = (searchParams.get('sortBy') ?? 'name') as
      'name' | 'firstReleaseDate' | 'igdbId' | 'createdAt';

    const sortDir = (searchParams.get('sortDir') ?? 'asc') as 'asc' | 'desc';

    const where = and(
      eq(games.humbleBundleWishlist, true),
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

    if (
      !pageParam &&
      !pageSizeParam &&
      !q &&
      !igdbId &&
      !searchParams.has('sortBy')
    ) {
      const data = await db
        .select(gameObject)
        .from(games)
        .where(eq(games.humbleBundleWishlist, true))
        .orderBy(games.name);

      return NextResponse.json({ success: true, data });
    }

    const page = Math.max(1, Number(pageParam ?? 1));
    const pageSize = Math.max(1, Number(pageSizeParam ?? 10));
    const offset = (page - 1) * pageSize;

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
    console.error('Error fetching Humble Bundle wishlist:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Connection failed. Please try again later.',
      },
      { status: 500 },
    );
  }
}
