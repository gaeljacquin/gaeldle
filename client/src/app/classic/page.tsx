import { getGames } from '@/lib/get-games';
import { checkNewGotd } from '@/lib/utils';
import Classic from '@/views/classic'

export default async function Page() {
  let data;
  let gotd;
  let newGotd = false;

  try {
    data = await fetch(`${process.env.serverUrl}/gotd/1`, { cache: 'no-store' });
    gotd = await data.json();
    newGotd = checkNewGotd(gotd.scheduled);
  } catch (error) {
    console.log('Something went wrong: ', error);
  }

  return (
    <>
      <Classic gotd={gotd} getGamesAction={getGames} newGotd={newGotd} />
    </>
  )
}
