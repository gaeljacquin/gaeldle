'use client';

import { Suspense } from 'react';
import { GameModeCard } from '@/components/game-mode-card';
import { GameModeCardSkeleton } from '@/components/game-mode-card-skeleton';
import { gameModesQueryOptions } from '@/lib/services/game-mode.service';
import { useSuspenseQuery } from '@tanstack/react-query';
import { GAME_MODE_SKELETON_COUNT } from '@workspace/shared';

function GameModeCardSkeletonGrid() {
  return (
    <>
      {Array.from({ length: GAME_MODE_SKELETON_COUNT }).map((_, i) => (
        <GameModeCardSkeleton key={i} />
      ))}
    </>
  );
}

function GameModeContent() {
  const { data: gameModes } = useSuspenseQuery(gameModesQueryOptions);

  return (
    <>
      {gameModes.map((gameMode) => (
        <GameModeCard
          key={gameMode.id}
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
