import { Game, getRandom } from '@/services/games';
import { getModeBySlug } from '@/services/modes';
import { bgCorrect } from '@/utils/client-constants';
import shuffleList from '@/utils/shuffle-list';
import Hilo from '@/views/hilo';

export default async function Page() {
  const mode = await getModeBySlug('hilo');
  const games = (await getRandom(mode.pixelationStep, mode.pixelation)) as Partial<Game>[];
  let reshuffledGames = shuffleList(games) as Partial<Game>[];
  reshuffledGames = games.map((game, index) => {
    if (index === games.length - 1) {
      const { frd, frdFormatted, ...rest } = game;

      return { ...rest };
    }

    return { ...game, bgStatus: bgCorrect };
  });

  return (
    <>
      <Hilo mode={mode} games={reshuffledGames} />
    </>
  );
}
