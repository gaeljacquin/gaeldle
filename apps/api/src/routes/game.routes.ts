import { Elysia, t } from 'elysia';
import { getAllGames, getGamesPage, getRandomGame, searchGames } from 'src/services/game.service';
import { verifyStackAccessToken } from 'src/utils/stack-auth';

const gameModeSchema = t.Union([
  t.Literal('cover-art'),
  t.Literal('artwork'),
  t.Literal('timeline'),
  t.Literal('timeline-2'),
  t.Literal('specifications'),
]);

export const gameRoutes = new Elysia({ prefix: '/api/game' })
  .get(
    '/',
    async ({ query, request, set }) => {
      const { page, pageSize } = query;
      const hasPagination = Boolean(page || pageSize);

      if (hasPagination) {
        const accessToken = request.headers.get('x-stack-access-token');
        const isAuthorized = await verifyStackAccessToken(accessToken);

        if (!isAuthorized) {
          set.status = 401;
          return {
            success: false,
            error: 'Unauthorized',
          };
        }

        const parsedPage = Number.parseInt(page ?? '1', 10);
        const parsedPageSize = Number.parseInt(pageSize ?? '10', 10);
        const pageNumber = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
        const pageSizeNumber = Number.isFinite(parsedPageSize) && parsedPageSize > 0
          ? parsedPageSize
          : 10;
        const cappedPageSize = Math.min(pageSizeNumber, 100);
        const { games, total } = await getGamesPage(pageNumber, cappedPageSize);

        return {
          success: true,
          data: games,
          meta: {
            page: pageNumber,
            pageSize: cappedPageSize,
            total,
          },
        };
      }

      const games = await getAllGames();
      return {
        success: true,
        data: games,
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        pageSize: t.Optional(t.String()),
      }),
    }
  )
  .get(
    '/artwork',
    async () => {
      const games = await getAllGames('artwork');
      return {
        success: true,
        data: games,
      };
    }
  )
  .get(
    '/search',
    async ({ query, set }) => {
      const { q, limit, mode } = query;

      // Validate query parameter
      if (!q || q.length < 2) {
        set.status = 400;
        return {
          success: false,
          error: 'Search query must be at least 2 characters',
        };
      }

      const games = await searchGames(q, limit ? Number.parseInt(limit) : 100, mode);
      return {
        success: true,
        data: games,
      };
    },
    {
      query: t.Object({
        q: t.String({ minLength: 2 }),
        limit: t.Optional(t.String()),
        mode: t.Optional(gameModeSchema),
      }),
    }
  )
  .post(
    '/random',
    async ({ body, set }) => {
      const game = await getRandomGame(body.excludeIds, body.mode);

      if (!game) {
        set.status = 404;
        return {
          success: false,
          error: 'No games available',
        };
      }

      return {
        success: true,
        data: game,
      };
    },
    {
      body: t.Object({
        excludeIds: t.Optional(t.Array(t.Number())),
        mode: t.Optional(gameModeSchema),
      }),
    }
  )
;
