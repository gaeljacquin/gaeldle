import { NextResponse } from 'next/server';
import { coverCheckAnswer, coverCheckAnswerProps } from '@/services/check-answer';
import { setAnswerProps1, setCoverVal } from '@/services/redis';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const data = await request.json();
  const action = data.action;

  switch (action) {
    case 'check-answer':
      const res = await checkAnswer(data);

      return NextResponse.json(res);
    case 'set-answer':
      void setAnswer(data);

      return NextResponse.json({ success: true });
    default:
      return NextResponse.json({ error: 'Invalid action' });
  }
}

async function checkAnswer(data: coverCheckAnswerProps) {
  const newLivesLeft = data.livesLeft - 1;
  const _ = { key: data.key, igdbId: data.igdbId, livesLeft: newLivesLeft };
  const res = await coverCheckAnswer(_);

  return res;
}

async function setAnswer(data: setAnswerProps1) {
  const { clientId, game } = data;
  void (await setCoverVal(clientId, game));
}
