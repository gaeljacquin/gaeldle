import { v4 as uuidv4 } from 'uuid';
import { Game, Games, getRandom } from '@/services/games';
import { getModeBySlug } from '@/services/modes';
import { setTimelineVal } from '@/services/redis';
import { bgOther1 } from '@/utils/server-constants';
import shuffleList from '@/utils/shuffle-list';
import Timeline from '@/views/timeline';

export default async function Page() {
  const mode = await getModeBySlug('timeline');
  const games = (await getRandom(mode.pixelationStep, mode.pixelation)) as Games;
  let reshuffledGames = shuffleList(games) as Partial<Game>[];
  reshuffledGames = reshuffledGames.map((game: Partial<Game>) => {
    const { frd, frdFormatted, ...rest } = game;
    void frd, frdFormatted;

    return { ...rest, bgStatus: bgOther1 };
  });
  const clientId = 'timeline-' + uuidv4();
  setTimelineVal(clientId, games);

  return (
    <>
      <Timeline mode={mode} games={reshuffledGames} clientId={clientId} />
    </>
  );
}
