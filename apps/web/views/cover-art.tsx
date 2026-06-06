import { Suspense } from 'react';

import GameListPlusImage from '@/components/game-list-plus-image';
import GameListPlusImageSkeleton from '@/components/game-list-plus-image-skeleton';

export default function CoverArt() {
  return (
    <Suspense fallback={<GameListPlusImageSkeleton />}>
      <GameListPlusImage gameModeSlug="cover-art" />
    </Suspense>
  );
}
