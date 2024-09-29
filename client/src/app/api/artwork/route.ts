import { NextResponse } from "next/server";
import { fetchGotd } from "~/src/lib/fetch-gotd";

export async function GET(request: Request) {
  const gotd = await fetchGotd(2, request.url);
  const { imageUrl: artworkUrl } = gotd.info;
  const { modeId, modes, id } = gotd;

  return NextResponse.json({
    gotd: { id, modeId, modes, artworkUrl },
  });
}
