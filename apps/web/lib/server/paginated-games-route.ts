import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, sql, type SQL, type SQLWrapper } from 'drizzle-orm';
import { db } from '@/lib/db';
import { games, gameObject } from '@workspace/db';

export type SortByField = 'name' | 'firstReleaseDate' | 'igdbId' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface PaginatedGamesRouteOptions {
  errorMessage?: string;
  allowUnpaginated?: boolean;
}

export function buildGamesOrderBy(
  sortBy: SortByField,
  sortDir: SortDirection,
  q?: string,
) {
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
}

export async function runPaginatedGamesRoute(
  request: NextRequest,
  filterCondition:
    | SQL
    | SQLWrapper
    | undefined
    | ((searchParams: URLSearchParams) => SQL | SQLWrapper | undefined),
  options: PaginatedGamesRouteOptions = {},
) {
  const { errorMessage = 'Failed to fetch games', allowUnpaginated = true } =
    options;

  try {
    const { searchParams } = request.nextUrl;
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const q = searchParams.get('q') ?? undefined;
    const igdbId = searchParams.get('igdbId') ?? undefined;

    const sortBy = (searchParams.get('sortBy') ?? 'name') as SortByField;
    const sortDir = (searchParams.get('sortDir') ?? 'asc') as SortDirection;

    const resolvedFilter =
      typeof filterCondition === 'function'
        ? filterCondition(searchParams)
        : filterCondition;

    const where = and(
      resolvedFilter,
      q ? sql`name ILIKE ${'%' + q + '%'}` : undefined,
      igdbId ? sql`igdb_id::text ILIKE ${'%' + igdbId + '%'}` : undefined,
    );

    const orderBy = buildGamesOrderBy(sortBy, sortDir, q);

    const hasPagination =
      searchParams.has('page') || searchParams.has('pageSize');

    if (
      allowUnpaginated &&
      !hasPagination &&
      !q &&
      !igdbId &&
      !searchParams.has('sortBy')
    ) {
      const data = await db
        .select(gameObject)
        .from(games)
        .where(where)
        .orderBy(orderBy);

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
    console.error(errorMessage, error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
