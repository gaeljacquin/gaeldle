import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { games, gameObject } from '@workspace/api/db';

export async function GET() {
  try {
    const data = await db
      .select(gameObject)
      .from(games)
      .where(eq(games.epic, true))
      .orderBy(games.name);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching Epic library:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Epic library' },
      { status: 500 },
    );
  }
}
