import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { games, gameObject } from '@workspace/db';
import GameDetails from '@/views/game-details';

export default async function GameDetailsPage({
  params,
}: {
  params: Promise<{ igdbId: string }>;
}) {
  const { igdbId: igdbIdStr } = await params;
  const igdbId = Number(igdbIdStr);
  const MAX_INT32 = 2_147_483_647;

  if (!Number.isInteger(igdbId) || igdbId <= 0 || igdbId > MAX_INT32) {
    notFound();
  }

  const [game] = await db
    .select(gameObject)
    .from(games)
    .where(eq(games.igdbId, igdbId))
    .limit(1);

  if (!game) {
    notFound();
  }

  return <GameDetails params={params} initialGame={game} />;
}
