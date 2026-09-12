import { Suspense } from 'react';
import WishlistNintendoView from '@/views/wishlist-nintendo';

export default function WishlistNintendoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
          Loading Nintendo Wishlist...
        </div>
      }
    >
      <WishlistNintendoView />
    </Suspense>
  );
}
