import { Suspense } from 'react';
import WishlistHumbleBundleView from '@/views/wishlist-humble-bundle';

export default function WishlistHumbleBundlePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
          Loading Humble Bundle Wishlist...
        </div>
      }
    >
      <WishlistHumbleBundleView />
    </Suspense>
  );
}
