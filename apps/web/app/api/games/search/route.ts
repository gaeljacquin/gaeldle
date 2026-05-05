// ORDER BY uses similarity() from the pg_trgm extension (GIN index: game_name_trgm_idx)
import { NextRequest, NextResponse } from 'next/server';
import { and, sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { games, gameObject, type GameModeSlug } from '@gaeldle/api-contract';
import { GAME_SEARCH_MIN_CHARS } from '@gaeldle/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const q = searchParams.get('q') ?? '';
    const limit = Math.max(1, Number(searchParams.get('limit') ?? 20));
    const mode = (searchParams.get('mode') ?? undefined) as GameModeSlug | undefined;

    if (q.length < GAME_SEARCH_MIN_CHARS) {
      return NextResponse.json({ success: true, data: [] });
    }

    const whereClause: SQL[] = [sql`name ILIKE ${'%' + q + '%'}`];

    if (mode === 'artwork') {
      whereClause.push(sql`artworks IS NOT NULL`, sql`json_array_length(artworks) > 0`);
    } else if (mode === 'cover-art') {
      whereClause.push(sql`image_url IS NOT NULL`);
    } else if (mode === 'image-gen') {
      whereClause.push(sql`ai_image_url IS NOT NULL`);
    } else if (mode === 'timeline' || mode === 'timeline-2') {
      whereClause.push(sql`first_release_date IS NOT NULL`);
    }

    const gamesList = await db
      .select(gameObject)
      .from(games)
      .where(and(...whereClause))
      .limit(limit)
      .orderBy(sql`similarity(name, ${q}) DESC`);

    return NextResponse.json({ success: true, data: gamesList });
  } catch (error) {
    console.error('Error searching games:', error);
    return NextResponse.json(
      { success: false, error: 'Connection failed. Please try again later.' },
      { status: 500 }
    );
  }
}
