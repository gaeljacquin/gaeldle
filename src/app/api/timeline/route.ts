import { NextResponse } from 'next/server';
import { timelineCheckAnswer, timelineCheckAnswerProps } from '@/services/check-answer';
import { setAnswerProps2, setTimelineVal } from '@/services/redis';

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

async function checkAnswer(data: timelineCheckAnswerProps) {
  const _ = { key: data.key, timeline: data.timeline, livesLeft: data.livesLeft };
  const res = await timelineCheckAnswer(_);

  return res;
}

async function setAnswer(data: setAnswerProps2) {
  const { clientId, games } = data;
  void (await setTimelineVal(clientId, games));
}
