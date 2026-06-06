import { Suspense, ViewTransition } from 'react';

import GameListPlusImage from '@/components/game-list-plus-image';
import GameListPlusImageSkeleton from '@/components/game-list-plus-image-skeleton';

export default function Artwork() {
  return (
    <Suspense
      fallback={
        <ViewTransition enter="slide-down">
          <GameListPlusImageSkeleton />
        </ViewTransition>
      }
    >
      <ViewTransition enter="slide-up">
        <GameListPlusImage gameModeSlug="artwork" />
      </ViewTransition>
    </Suspense>
  );
}
