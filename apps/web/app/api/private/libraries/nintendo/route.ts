import { NextRequest } from 'next/server';
import { and, eq, isNull, or } from 'drizzle-orm';
import { games } from '@workspace/db';
import { runPaginatedGamesRoute } from '@/lib/server/paginated-games-route';

export async function GET(request: NextRequest) {
  return runPaginatedGamesRoute(
    request,
    (searchParams) => {
      const filter = (searchParams.get('filter') ?? 'all') as
        'all' | 'owned' | 'demos';

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

      return filterCondition;
    },
    { errorMessage: 'Failed to fetch Nintendo library' },
  );
}
