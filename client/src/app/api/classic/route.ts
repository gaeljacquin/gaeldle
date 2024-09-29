import { NextResponse } from "next/server";
import { fetchGotd } from "~/src/lib/fetch-gotd";

export async function GET(request: Request) {
  const gotd = await fetchGotd(1, request.url);
  const { imageUrl } = gotd.games;
  const { modeId, modes, id } = gotd;

  return NextResponse.json({
    gotd: { id, modeId, modes, imageUrl },
  });
}
