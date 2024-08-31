import { getGames } from '@/lib/get-games';
import { getRandomGame } from '@/lib/get-random-game';
import ClassicUnlimited from '@/views/classic-unlimited';

export default async function Page() {
  return (
    <>
      <ClassicUnlimited
        getRandomGameAction={getRandomGame}
        getGamesAction={getGames}
      />
    </>
  )
}
