import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { games, gameObject } from '@workspace/api-contract';
import { stackServerApp } from '@/stack/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ igdbId: string }> },
) {
  const user = await stackServerApp.getUser({ or: 'return-null' });

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { igdbId: igdbIdStr } = await params;
  const igdbId = Number(igdbIdStr);

  if (!Number.isInteger(igdbId) || igdbId <= 0) {
    return NextResponse.json({ error: 'Invalid igdbId' }, { status: 400 });
  }

  const [game] = await db
    .select(gameObject)
    .from(games)
    .where(eq(games.igdbId, igdbId))
    .limit(1);

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: game });
}
