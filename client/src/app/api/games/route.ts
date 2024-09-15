import { NextResponse } from "next/server";
import { upstashRedisInit } from "@/lib/upstash-redis";
import { genKey } from "~/src/lib/utils";

export async function GET() {
  const key = genKey("games");
  let data;
  let games;

  data = await fetch(`${process.env.upstashRedisRestUrl}/get/${key}`, {
    cache: "no-store",
    ...upstashRedisInit,
  });
  games = JSON.parse(await (await data.json()).result);

  if (!games) {
    data = await fetch(`${process.env.serverUrl}/games`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${process.env.bearerToken}`,
      },
    });
    games = await data.json();
  }

  return NextResponse.json(games);
}
