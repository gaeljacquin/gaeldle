import { db } from '@/lib/db';
import { artStyles as artStylesView } from '@workspace/api-contract';
import { NextResponse } from 'next/server';

export async function GET() {
  const artStyles = await db.select().from(artStylesView);

  return NextResponse.json(artStyles);
}
