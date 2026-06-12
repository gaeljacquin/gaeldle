import { db } from '@/lib/db';
import { artStyles as artStylesView } from '@workspace/api-contract';
import { NextResponse } from 'next/server';
import { hexclaveServerApp } from '@/hexclave/server';

export async function GET() {
  const user = await hexclaveServerApp.getUser({ or: 'return-null' });

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const artStyles = await db.select().from(artStylesView);

  return NextResponse.json(artStyles);
}
