import { getGame, getGames } from '@/services/games';
import { getModeBySlug } from '@/services/modes';
import Cover from '@/views/cover';

export default async function Page() {
  const mode = await getModeBySlug('cover');
  const games = await getGames();
  const game = await getGame(19565);

  return (
    <>
      <Cover mode={mode} games={games} game={game} />
    </>
  );
}
