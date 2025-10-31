import { Elysia, t } from 'elysia';
import { getAllGames, getRandomGame } from 'src/services/game.service';

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
        mode: t.Optional(t.String()),
      }),
    }
  )
;
