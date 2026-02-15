import GameDetails from "@/views/game-details";

export default function GameDetailsPage({
  params,
}: Readonly<{
  params: Promise<{ igdbId: string }>;
}>) {
  return <GameDetails params={params} />;
}
