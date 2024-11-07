import { v4 as uuidv4 } from 'uuid';
import { Game, getGames, getOneRandom } from '@/services/games';
import { getModeBySlug } from '@/services/modes';
import { setCoverVal } from '@/services/redis';
import Cover from '@/views/cover';

export default async function Page() {
  const mode = await getModeBySlug('cover');
  const games = await getGames();
  const res = await getOneRandom();
  const game = ((await res) as Game[])[0] as Game;
  const clientId = 'cover-' + uuidv4();
  setCoverVal(clientId, game);
  const { igdbId, name, ...rest } = game;
  void igdbId, name;

  return (
    <>
      <Cover
        mode={mode}
        games={games}
        game={rest}
        clientId={clientId}
        getOneRandom={getOneRandom}
      />
    </>
  );
}
