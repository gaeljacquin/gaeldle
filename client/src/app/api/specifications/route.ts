import { NextResponse } from "next/server";
import { fetchGotd } from "~/src/lib/fetch-gotd";

export async function GET(request: Request) {
  const gotd = await fetchGotd(4, request.url);
  const { modeId, modes, id } = gotd;

  return NextResponse.json({
    gotd: { id, modeId, modes },
  });
}
