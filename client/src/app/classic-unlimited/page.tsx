import { getGames } from '@/lib/get-games';
import ClassicUnlimited from '@/views/classic-unlimited';

export default async function Page() {
  return (
    <>
      <ClassicUnlimited
        getGamesAction={getGames}
      />
    </>
  )
}
