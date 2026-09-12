import { Suspense } from 'react';
import LibrarySteamView from '@/views/library-steam';

export default function LibrarySteamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
          Loading Steam Library...
        </div>
      }
    >
      <LibrarySteamView />
    </Suspense>
  );
}
