import { NextResponse } from 'next/server';
import { getMode } from '@/services/modes';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  void request;
  const { id } = await params;

  const mode = await getMode(parseInt(id, 10));

  return NextResponse.json({
    mode,
  });
}
