import GameDetails from '@/views/game-details';

export default function GameDetailsPage({
  params,
}: {
  params: Promise<{ igdbId: string }>;
}) {
  return <GameDetails params={params} />;
}
