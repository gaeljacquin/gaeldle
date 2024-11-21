import { NextResponse } from 'next/server';
import { getRandom } from '@/services/games';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const data = await request.json();
  const { pixelationStep, pixelation } = data;
  const res = await getRandom(pixelationStep, pixelation);

  return NextResponse.json(res);
}
