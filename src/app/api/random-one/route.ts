import { NextResponse } from 'next/server';
import { getOneRandom } from '@/services/games';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const data = await request.json();
  const newList = data.newList;
  const res = await getOneRandom(newList);

  return NextResponse.json(res);
}
