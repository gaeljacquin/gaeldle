import { Suspense } from 'react';
import LibraryXboxView from '@/views/library-xbox';

export default function LibraryXboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
          Loading XBOX Library...
        </div>
      }
    >
      <LibraryXboxView />
    </Suspense>
  );
}
