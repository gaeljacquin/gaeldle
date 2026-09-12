import { Suspense } from 'react';
import WishlistSteamView from '@/views/wishlist-steam';

export default function WishlistSteamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
          Loading Steam Wishlist...
        </div>
      }
    >
      <WishlistSteamView />
    </Suspense>
  );
}
