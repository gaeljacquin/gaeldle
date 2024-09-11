import { NextResponse } from "next/server";
import { keyNameByEnv } from "@/lib/utils";
import { upstashRedisInit } from "@/lib/upstash-redis";

export async function GET() {
  const key = keyNameByEnv("games");
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
    });
    games = await data.json();
  }

  return NextResponse.json(games);
}
