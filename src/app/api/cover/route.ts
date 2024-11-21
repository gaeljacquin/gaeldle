import { NextResponse } from 'next/server';
import { coverCheckAnswer } from '@/services/check-answer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const data = await request.json();
  const newLivesLeft = data.livesLeft - 1;
  const res = await coverCheckAnswer(data.clientId, data.igdbId, newLivesLeft);

  return NextResponse.json(res);
}
