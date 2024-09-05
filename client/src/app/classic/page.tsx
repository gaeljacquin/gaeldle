import { getGames } from '@/lib/get-games';
import { upstashRedisInit } from '@/lib/upstash-redis';
import { checkNewGotd, keyNameByEnv } from '@/lib/utils';
import Classic from '@/views/classic'

export default async function Page() {
  let data;
  let gotd;
  let newGotd = false;
  const key = keyNameByEnv('gotd_classic');

  try {
    data = await fetch(
      `${process.env.upstashRedisRestUrl}/get/${key}`,
      { cache: 'no-store', ...upstashRedisInit },
    )
    gotd = JSON.parse(await (await data.json()).result);

    if (!gotd) {
      data = await fetch(`${process.env.serverUrl}/gotd/1`, { cache: 'no-store' });
      gotd = await data.json();
    }

    newGotd = checkNewGotd(gotd.scheduled);
  } catch (error) {
    console.error('Something went wrong: ', error);
  }

  return (
    <>
      <Classic gotd={gotd} getGamesAction={getGames} newGotd={newGotd} />
    </>
  )
}
