import { getGames } from '@/lib/get-games';
import Classic from '@/views/classic'

export default async function Page() {
  let data = await fetch(`${process.env.serverUrl}/gotd/1`);
  let gotd = await data.json();

  return (
    <>
      <Classic gotd={gotd} getGamesAction={getGames} />
    </>
  )
}
