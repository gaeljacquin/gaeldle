import { NextResponse } from 'next/server';
import { getOneRandom } from '@/services/games';

export async function POST(request: Request) {
  void request;
  const { blockList } = await request.json();
  const game = await getOneRandom(blockList.length > 0 ? blockList : undefined);

  return NextResponse.json({
    game,
  });
}
