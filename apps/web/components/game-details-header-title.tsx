'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { getGameByIgdbId } from '@/lib/services/game.service';

export default function GameDetailsHeaderTitle({ igdbId }: { igdbId: string }) {
  const { data: game } = useSuspenseQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  return <>{game.name}</>;
}
