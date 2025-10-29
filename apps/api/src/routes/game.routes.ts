import { Elysia, t } from 'elysia';
import { getAllGames, getRandomGame, getGameById } from '../services/game.service';

export const gameRoutes = new Elysia({ prefix: '/api/game' })
  .post(
    '/',
    async ({ body }) => {
      const games = await getAllGames(body.artwork);
      return {
        success: true,
        data: games,
      };
    },
    {
      body: t.Object({
        artwork: t.Optional(t.Boolean()),
      }),
    }
  )
  .post(
    '/random',
    async ({ body, set }) => {
      const game = await getRandomGame(body.excludeIds, body.artwork);

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
        artwork: t.Optional(t.Boolean()),
      }),
    }
  )
  .get(
    '/:gameId',
    async ({ params: { gameId }, set }) => {
      const game = await getGameById(parseInt(gameId));

      if (!game) {
        set.status = 404;
        return {
          success: false,
          error: 'Game not found',
        };
      }

      return {
        success: true,
        data: game,
      };
    },
    {
      params: t.Object({
        gameId: t.String(),
      }),
    }
  )
;
