import { NextRequest, NextResponse } from 'next/server';
import { and, notInArray, sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { games, gameObject, type GameModeSlug } from '@workspace/api-contract';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const excludeIdsParam = searchParams.get('excludeIds');
    const excludeIds = excludeIdsParam
      ? excludeIdsParam.split(',').map(Number).filter(Boolean)
      : [];
    const count = Math.max(
      1,
      Math.min(50, Number(searchParams.get('count') ?? 1)),
    );
    const mode = (searchParams.get('mode') ?? undefined) as
      | GameModeSlug
      | undefined;

    const conditions: (SQL | undefined)[] = [];

    if (excludeIds.length > 0) {
      conditions.push(notInArray(games.id, excludeIds));
    }

    if (mode === 'artwork') {
      conditions.push(
        sql`artworks IS NOT NULL`,
        sql`json_array_length(artworks) > 0`,
      );
    } else if (mode === 'cover-art') {
      conditions.push(sql`image_url IS NOT NULL`);
    } else if (mode === 'image-gen') {
      conditions.push(sql`ai_image_url IS NOT NULL`);
    } else if (mode === 'timeline' || mode === 'timeline-2') {
      conditions.push(sql`first_release_date IS NOT NULL`);
    }

    const gamesList = await db
      .select(gameObject)
      .from(games)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(count);

    if (gamesList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No game found' },
        { status: 404 },
      );
    }

    if (count === 1 && !searchParams.has('count')) {
      return NextResponse.json({ success: true, data: gamesList[0] });
    }

    return NextResponse.json({ success: true, data: gamesList });
  } catch (error) {
    console.error('Error fetching random game:', error);
    return NextResponse.json(
      { success: false, error: 'Connection failed. Please try again later.' },
      { status: 500 },
    );
  }
}
