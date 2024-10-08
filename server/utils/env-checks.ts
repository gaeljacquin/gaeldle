import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '~/src/auth/jwt-auth.guard';

function isDevMode() {
  return (
    process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development'
  );
}

export function jwtAuthGuard() {
  return applyDecorators(...(isDevMode() ? [] : [UseGuards(JwtAuthGuard)]));
}

export function genKey(key: string) {
  key += isDevMode() ? '_dev' : '';

  return key;
}

export async function getRandomGames(gamesService, numCards, sampleSize) {
  const games = await gamesService.findRandom(numCards, sampleSize);

  return games;
}

export async function getRandomGame(gamesService, list) {
  const game = await gamesService.findOneRandom(list);

  return game;
}
