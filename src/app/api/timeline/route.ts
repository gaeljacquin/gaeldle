import { NextResponse } from 'next/server';
import { timelineCheckAnswer } from '@/services/check-answer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const data = await request.json();
  const { clientId, timeline, livesLeft } = data;
  const res = await timelineCheckAnswer(clientId, timeline, livesLeft);

  return NextResponse.json(res);
}
