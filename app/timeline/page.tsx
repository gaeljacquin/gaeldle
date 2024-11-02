import { Game, getRandom } from '@/services/games';
import { getModeBySlug } from '@/services/modes';
import Timeline from '@/views/timeline';

export default async function Page() {
  const mode = await getModeBySlug('timeline');
  const games = (await getRandom(mode.pixelationStep, mode.pixelation)) as Partial<Game>[];

  return (
    <>
      <Timeline mode={mode} games={games} />
    </>
  );
}
