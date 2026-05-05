import { NextRequest, NextResponse } from 'next/server';
import { and, notInArray, sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { games, gameObject, type GameModeSlug } from '@gaeldle/api-contract';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const excludeIdsParam = searchParams.get('excludeIds');
    const excludeIds = excludeIdsParam
      ? excludeIdsParam.split(',').map(Number).filter(Boolean)
      : [];
    const mode = (searchParams.get('mode') ?? undefined) as GameModeSlug | undefined;

    const conditions: (SQL | undefined)[] = [];

    if (excludeIds.length > 0) {
      conditions.push(notInArray(games.id, excludeIds));
    }

    if (mode === 'artwork') {
      conditions.push(sql`artworks IS NOT NULL`, sql`json_array_length(artworks) > 0`);
    } else if (mode === 'cover-art') {
      conditions.push(sql`image_url IS NOT NULL`);
    } else if (mode === 'image-gen') {
      conditions.push(sql`ai_image_url IS NOT NULL`);
    } else if (mode === 'timeline' || mode === 'timeline-2') {
      conditions.push(sql`first_release_date IS NOT NULL`);
    }

    const [game] = await db
      .select(gameObject)
      .from(games)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (!game) {
      return NextResponse.json({ success: false, error: 'No game found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: game });
  } catch (error) {
    console.error('Error fetching random game:', error);
    return NextResponse.json(
      { success: false, error: 'Connection failed. Please try again later.' },
      { status: 500 }
    );
  }
}
