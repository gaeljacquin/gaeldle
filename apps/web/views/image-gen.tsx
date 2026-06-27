import { Suspense, ViewTransition } from 'react';

import GameListPlusImage from '@/components/game-list-plus-image';
import GameListPlusImageSkeleton from '@/components/game-list-plus-image-skeleton';
import { ErrorBoundary } from '@/components/error-boundary';

export default function ImageGen() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <ViewTransition enter="slide-down">
            <GameListPlusImageSkeleton />
          </ViewTransition>
        }
      >
        <ViewTransition enter="slide-up">
          <GameListPlusImage gameModeSlug="image-gen" />
        </ViewTransition>
      </Suspense>
    </ErrorBoundary>
  );
}
