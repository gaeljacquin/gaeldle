import { NextResponse } from "next/server";
import { checkNewGotd } from "@/lib/utils";
import { upstashRedisInit } from "@/lib/upstash-redis";

export async function GET() {
  const key = "keywords";
  let data;
  let gotd;
  let newGotd = false;

  if (process.env.NODE_ENV !== "development") {
    data = await fetch(`${process.env.upstashRedisRestUrl}/get/${key}`, {
      cache: "no-store",
      ...upstashRedisInit,
    });
    gotd = JSON.parse(await (await data.json()).result);
  }

  if (!gotd) {
    data = await fetch(`${process.env.serverUrl}/gotd/3`, {
      cache: "no-store",
    });
    gotd = await data.json();
  }

  const { modeId, modes, id, games } = gotd;
  const { keywords } = games;
  const keyword = keywords[0].name;
  const numKeywords = keywords.length;
  modes.lives = Math.min(modes.lives, numKeywords);
  newGotd = checkNewGotd(gotd.scheduled);

  return NextResponse.json({
    gotd: { id, modeId, modes, keyword, numKeywords },
    newGotd,
  });
}
