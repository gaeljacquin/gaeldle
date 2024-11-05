function isDevMode() {
  return (
    process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development'
  );
}

export function genKey(key: string) {
  key += isDevMode() ? '_dev' : '';

  return key;
}

export async function getRandomGames(gamesService, numCards) {
  const games = await gamesService.findRandom(numCards);

  return games;
}

export async function getRandomGame(gamesService, list) {
  const game = await gamesService.findOneRandom(list);

  return game;
}
