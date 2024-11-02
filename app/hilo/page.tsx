import { getGames } from '@/services/games';
import { getModeBySlug } from '@/services/modes';
import Hilo from '@/views/hilo';

export default async function Page() {
  const mode = await getModeBySlug('hilo');
  const games = await getGames();

  return (
    <>
      <Hilo mode={mode} games={games} />
    </>
  );
}
