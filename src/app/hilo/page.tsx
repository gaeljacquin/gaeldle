import { v4 as uuidv4 } from 'uuid';
import { Game, getRandom } from '@/services/games';
import { getModeBySlug } from '@/services/modes';
import { setHiloVal } from '@/services/redis';
import { bgCorrect } from '@/utils/server-constants';
import shuffleList from '@/utils/shuffle-list';
import Hilo from '@/views/hilo';

export default async function Page() {
  const mode = await getModeBySlug('hilo');
  const games = (await getRandom(mode.pixelationStep, mode.pixelation)) as Partial<Game>[];
  let reshuffledGames = shuffleList(games) as Partial<Game>[];
  const nextGame = games[games.length - 1];
  reshuffledGames = games.map((game, index) => {
    if (index === games.length - 1) {
      const { frd, frdFormatted, ...rest } = game;
      void frd, frdFormatted;

      return { ...rest };
    }

    return { ...game, bgStatus: bgCorrect };
  });
  const clientId = 'hilo-' + uuidv4();
  setHiloVal(clientId, nextGame as Game);

  return (
    <>
      <Hilo mode={mode} games={reshuffledGames} clientId={clientId} />
    </>
  );
}
