import { Suspense } from 'react';

import GameListPlusImage from '@/components/game-list-plus-image';
import GameListPlusImageSkeleton from '@/components/game-list-plus-image-skeleton';

export default function ImageGen() {
  return (
    <Suspense fallback={<GameListPlusImageSkeleton />}>
      <GameListPlusImage gameModeSlug="image-gen" />
    </Suspense>
  );
}
