import { db } from '@/lib/db';
import { gameModes as gameModesView } from '@workspace/api-contract';
import { NextResponse } from 'next/server';

export async function GET() {
  const gameModes = await db.select().from(gameModesView);

  return NextResponse.json(gameModes);
}
