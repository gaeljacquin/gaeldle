import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { games } from '@workspace/db';
import { runPaginatedGamesRoute } from '@/lib/server/paginated-games-route';

export async function GET(request: NextRequest) {
  return runPaginatedGamesRoute(request, eq(games.epicWishlist, true), {
    errorMessage: 'Failed to fetch Epic wishlist',
  });
}
