import { db } from '@/lib/db';
import {
  gameModes as gameModesView,
  gameModeTable,
  domainEvents,
} from '@workspace/api-contract';
import { NextRequest, NextResponse } from 'next/server';
import { asc, eq, sql, inArray } from 'drizzle-orm';
import { hexclaveServerApp } from '@/hexclave/server';

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
      const user = await hexclaveServerApp.getUser({ or: 'return-null' });
      const actorId = user?.id ?? 'unknown';
      const idsToUpdate = body
        .map((item) => item.id)
        .filter((id) => id !== undefined);

      await db.transaction(async (tx) => {
        const previousModes =
          idsToUpdate.length > 0
            ? await tx
                .select({
                  id: gameModeTable.id,
                  ordinal: gameModeTable.ordinal,
                })
                .from(gameModeTable)
                .where(inArray(gameModeTable.id, idsToUpdate))
            : [];

        // First, temporarily set all ordinals to unique negative values to prevent unique constraint violations
        for (const item of body) {
          const { id, ordinal } = item;

          if (id === undefined || ordinal === undefined) {
            throw new Error('id and ordinal are required for bulk updates');
          }

          await tx
            .update(gameModeTable)
            .set({
              ordinal: -Number(id),
            })
            .where(eq(gameModeTable.id, id));
        }

        // Second, update ordinals to their final desired values
        for (const item of body) {
          const { id, ordinal } = item;

          await tx
            .update(gameModeTable)
            .set({
              ordinal: Number(ordinal),
            })
            .where(eq(gameModeTable.id, id));
        }

        const newModes =
          idsToUpdate.length > 0
            ? await tx
                .select({
                  id: gameModeTable.id,
                  ordinal: gameModeTable.ordinal,
                })
                .from(gameModeTable)
                .where(inArray(gameModeTable.id, idsToUpdate))
            : [];

        await tx.insert(domainEvents).values({
          eventType: 'game_mode.ordinals.updated',
          actorId,
          payload: {
            previousOrder: previousModes.map((item) => ({
              id: item.id,
              ordinal: item.ordinal,
            })),
            newOrder: newModes.map((item) => ({
              id: item.id,
              ordinal: item.ordinal,
            })),
          },
        });
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

    const user = await hexclaveServerApp.getUser({ or: 'return-null' });
    const actorId = user?.id ?? 'unknown';

    const [updatedGameMode] = await db
      .update(gameModeTable)
      .set({
        slug,
        title,
        description,
        level,
        maxAttempts: Number(maxAttempts),
        isActive: isActive ? 1 : 0,
        isCoverArt: isCoverArt ? 1 : 0,
      })
      .where(eq(gameModeTable.id, id))
      .returning();

    if (updatedGameMode) {
      await db.insert(domainEvents).values({
        eventType: 'game_mode.updated',
        actorId,
        payload: {
          gameModeId: updatedGameMode.id,
          slug: updatedGameMode.slug,
          title: updatedGameMode.title,
          description: updatedGameMode.description,
          level: updatedGameMode.level,
          maxAttempts: updatedGameMode.maxAttempts,
          isActive: updatedGameMode.isActive,
          isCoverArt: updatedGameMode.isCoverArt,
        },
      });
    }

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, title, description, level, maxAttempts, isCoverArt } = body;

    if (!slug || !title || !level) {
      return NextResponse.json(
        { error: 'Slug, title, and level are required' },
        { status: 400 },
      );
    }

    const [insertedGameMode] = await db
      .insert(gameModeTable)
      .values({
        slug,
        title,
        description,
        level,
        maxAttempts: Number(maxAttempts) || 3,
        isCoverArt: isCoverArt ? 1 : 0,
      })
      .returning();

    const user = await hexclaveServerApp.getUser({ or: 'return-null' });
    const actorId = user?.id ?? 'unknown';

    if (insertedGameMode) {
      await db.insert(domainEvents).values({
        eventType: 'game_mode.created',
        actorId,
        payload: {
          gameModeId: insertedGameMode.id,
          slug: insertedGameMode.slug,
          title: insertedGameMode.title,
          description: insertedGameMode.description,
          level: insertedGameMode.level,
          maxAttempts: insertedGameMode.maxAttempts,
          isActive: insertedGameMode.isActive,
          isCoverArt: insertedGameMode.isCoverArt,
        },
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating game mode:', error);

    // Provide a cleaner error message if it's a unique constraint violation on slug
    const errorMessage = (error as Error).message;

    if (
      errorMessage.includes('unique constraint') &&
      errorMessage.includes('slug')
    ) {
      return NextResponse.json(
        { error: 'A game mode with this slug already exists.' },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
