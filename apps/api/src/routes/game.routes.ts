import { Elysia, t } from 'elysia';
import { getAllGames, getRandomGame, searchGames } from 'src/services/game.service';

const gameModeSchema = t.Union([
  t.Literal('cover-art'),
  t.Literal('image-ai'),
  t.Literal('artwork'),
  t.Literal('timeline'),
  t.Literal('timeline-2'),
  t.Literal('specifications'),
]);

export const gameRoutes = new Elysia({ prefix: '/api/game' })
  .get(
    '/',
    async () => {
      const games = await getAllGames();
      return {
        success: true,
        data: games,
      };
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
