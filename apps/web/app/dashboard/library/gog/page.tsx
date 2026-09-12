import { Suspense } from 'react';
import LibraryGogView from '@/views/library-gog';

export default function LibraryGogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
          Loading GOG Library...
        </div>
      }
    >
      <LibraryGogView />
    </Suspense>
  );
}
