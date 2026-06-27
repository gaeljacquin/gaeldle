import { db } from '@/lib/db';
import {
  gameModes as gameModesView,
  gameModeTable,
} from '@workspace/api-contract';
import { NextRequest, NextResponse } from 'next/server';
import { asc, eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const all = searchParams.get('all') === 'true';

    if (all) {
      const allGameModes = await db
        .select()
        .from(gameModeTable)
        .orderBy(asc(gameModeTable.ordinal));

      return NextResponse.json(allGameModes);
    }

    const gameModes = await db.select().from(gameModesView);

    return NextResponse.json(gameModes);
  } catch (error) {
    console.error('Error fetching game modes:', error);

    return NextResponse.json(
      { error: 'Failed to fetch game modes' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      await db.transaction(async (tx) => {
        for (const item of body) {
          const { id, ordinal } = item;

          if (id === undefined || ordinal === undefined) {
            throw new Error('id and ordinal are required for bulk updates');
          }

          await tx
            .update(gameModeTable)
            .set({
              ordinal: Number(ordinal),
              updatedAt: new Date(),
            })
            .where(eq(gameModeTable.id, id));
        }
      });

      await db.execute(sql`REFRESH MATERIALIZED VIEW active_game_modes`);

      return NextResponse.json({ success: true });
    }

    const {
      id,
      slug,
      title,
      description,
      level,
      maxAttempts,
      isActive,
      isCoverArt,
    } = body;

    if (id === undefined) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await db
      .update(gameModeTable)
      .set({
        slug,
        title,
        description,
        level,
        maxAttempts: Number(maxAttempts),
        isActive: isActive ? 1 : 0,
        isCoverArt: isCoverArt ? 1 : 0,
        updatedAt: new Date(),
      })
      .where(eq(gameModeTable.id, id));

    await db.execute(sql`REFRESH MATERIALIZED VIEW active_game_modes`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating game mode:', error);

    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
