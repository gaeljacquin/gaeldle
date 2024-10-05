import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '~/src/auth/jwt-auth.guard';
import { Games } from '~/types/games';
import { testGameIgdbIds } from './constants';

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
  const games = (await (isDevMode()
    ? gamesService.dbFindRandomDev(numCards)
    : gamesService.dbFindRandom(numCards, sampleSize))) as Games;

  return games;
}

export async function getRandomGame(gamesService, list) {
  const daList = isDevMode()
    ? testGameIgdbIds.filter((id) => !list.includes(id))
    : list;
  const game = await (isDevMode()
    ? gamesService.findOneRandomDev(daList)
    : gamesService.findOneRandom(daList));

  return game;
}
