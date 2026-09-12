import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { domainEvents } from '@workspace/db';

const WISHLIST_ALIAS_MAP: Record<string, string[]> = {
  steam: ['steam', 'steamWishlist'],
  steamWishlist: ['steam', 'steamWishlist'],
  epic: ['epic', 'epicWishlist'],
  epicWishlist: ['epic', 'epicWishlist'],
  nintendo: ['nintendo', 'nintendoWishlist'],
  nintendoWishlist: ['nintendo', 'nintendoWishlist'],
  xbox: ['xbox', 'xboxWishlist'],
  xboxWishlist: ['xbox', 'xboxWishlist'],
  'humble-bundle': ['humble-bundle', 'humbleBundle', 'humbleBundleWishlist'],
  humbleBundle: ['humble-bundle', 'humbleBundle', 'humbleBundleWishlist'],
  humbleBundleWishlist: [
    'humble-bundle',
    'humbleBundle',
    'humbleBundleWishlist',
  ],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const wishlist = searchParams.get('wishlist');

    if (!wishlist) {
      return NextResponse.json(
        { success: false, error: 'Wishlist parameter is required' },
        { status: 400 },
      );
    }

    const aliases = WISHLIST_ALIAS_MAP[wishlist] ?? [wishlist];

    const aliasConditions = aliases.map((alias) =>
      or(
        sql`${domainEvents.payload}->>'wishlist' = ${alias}`,
        sql`${domainEvents.payload}->>'wishlistKey' = ${alias}`,
      )!,
    );

    const [latest] = await db
      .select({ occurredAt: domainEvents.occurredAt })
      .from(domainEvents)
      .where(
        and(
          eq(domainEvents.eventType, 'wishlist.game_removed'),
          or(...aliasConditions),
        ),
      )
      .orderBy(desc(domainEvents.occurredAt))
      .limit(1);

    return NextResponse.json({
      success: true,
      lastUpdatedAt: latest?.occurredAt
        ? latest.occurredAt.toISOString()
        : null,
    });
  } catch (error) {
    console.error('Error fetching wishlist last updated:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wishlist last updated' },
      { status: 500 },
    );
  }
}
