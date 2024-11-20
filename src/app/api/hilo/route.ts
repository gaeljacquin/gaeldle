import { NextResponse } from 'next/server';
import { hiloCheckAnswer } from '@/services/check-answer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const data = await request.json();
  const { clientId, currentGame, operator } = data;
  const res = await hiloCheckAnswer(clientId, currentGame, operator);

  return NextResponse.json(res);
}
