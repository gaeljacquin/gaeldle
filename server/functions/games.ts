export async function getRandomGames(modeId: number) {
  const games = await fetch(
    `${process.env.CLIENT_URL}/api/random-games/${modeId}`,
  );

  return await games.json();
}

export async function getRandomGame(blockList?: number[]) {
  const game = await fetch(`${process.env.CLIENT_URL}/api/random-game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ blockList }),
  });

  return await game.json();
}
