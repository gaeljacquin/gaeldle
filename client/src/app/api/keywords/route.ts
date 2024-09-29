import { NextResponse } from "next/server";
import { fetchGotd } from "~/src/lib/fetch-gotd";

export async function GET(request: Request) {
  const gotd = await fetchGotd(3, request.url);
  const { modeId, modes, id, games } = gotd;
  const { keywords } = games;
  const keyword = keywords[0].name;
  const numKeywords = keywords.length;
  modes.lives = Math.min(modes.lives, numKeywords);

  return NextResponse.json({
    gotd: { id, modeId, modes, keyword, numKeywords },
  });
}
