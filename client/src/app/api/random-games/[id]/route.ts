import { NextResponse } from 'next/server';
import { getRandom } from '@/services/games';
import { getMode } from '@/services/modes';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  void request;
  const { id } = params;
  const mode = await getMode(parseInt(id, 10));
  const { pixelation: sampleSize, pixelationStep: numCards } = mode;
  const games = await getRandom(numCards, sampleSize);

  return NextResponse.json({
    games,
  });
}
