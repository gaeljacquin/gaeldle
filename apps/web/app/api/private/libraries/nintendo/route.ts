import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { games, gameObject } from '@workspace/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const isPaginated =
      searchParams.has('page') || searchParams.has('pageSize');

    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.max(1, Number(searchParams.get('pageSize') ?? 10));
    const q = searchParams.get('q') ?? undefined;
    const igdbId = searchParams.get('igdbId') ?? undefined;
    const filter = (searchParams.get('filter') ?? 'all') as
      'all' | 'owned' | 'demos';

    const sortBy = (searchParams.get('sortBy') ?? 'name') as
      'name' | 'firstReleaseDate' | 'igdbId' | 'createdAt';

    const sortDir = (searchParams.get('sortDir') ?? 'asc') as 'asc' | 'desc';
    const offset = (page - 1) * pageSize;

    const filterCondition = (() => {
      if (filter === 'demos') {
        return eq(games.nintendoDemo, true);
      }
      if (filter === 'owned') {
        return and(
          eq(games.nintendo, true),
          or(eq(games.nintendoDemo, false), isNull(games.nintendoDemo)),
        );
      }
      // 'all' includes games owned or demo on Nintendo
      return or(eq(games.nintendo, true), eq(games.nintendoDemo, true));
    })();

    const where = and(
      filterCondition,
      or(eq(games.hidden, false), isNull(games.hidden)),
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

    if (isPaginated) {
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
    }

    const data = await db
      .select(gameObject)
      .from(games)
      .where(where)
      .orderBy(orderBy);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching Nintendo library:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Nintendo library' },
      { status: 500 },
    );
  }
}
