'use client';

import { Suspense, useEffect } from 'react';
import { GameModeCard } from '@/components/game-mode-card';
import { GameModeCardSkeleton } from '@/components/game-mode-card-skeleton';
import { gameModesQueryOptions } from '@/lib/services/game-mode.service';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useGameModeStore } from '@/lib/stores/game-mode-store';

function GameModeCardSkeletonGrid() {
  const activeGameModeCount = useGameModeStore(
    (state) => state.activeGameModeCount,
  );

  return (
    <>
      {Array.from({ length: activeGameModeCount }).map((_, i) => (
        <GameModeCardSkeleton key={i} />
      ))}
    </>
  );
}

function GameModeContent() {
  const { data: gameModes } = useSuspenseQuery(gameModesQueryOptions);
  const setActiveGameModeCount = useGameModeStore(
    (state) => state.setActiveGameModeCount,
  );

  useEffect(() => {
    setActiveGameModeCount(gameModes.length);
  }, [gameModes.length, setActiveGameModeCount]);

  return (
    <>
      {gameModes.map((gameMode) => (
        <GameModeCard
          key={gameMode.slug}
          slug={gameMode.slug}
          title={gameMode.title}
          description={gameMode.description}
          level={gameMode.level}
          gradient={gameMode.gradient}
        />
      ))}
    </>
  );
}

export default function GameModeGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Suspense fallback={<GameModeCardSkeletonGrid />}>
        <GameModeContent />
      </Suspense>
    </div>
  );
}
