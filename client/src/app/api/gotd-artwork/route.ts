import { NextResponse } from "next/server";
import { checkNewGotd, keyNameByEnv } from "@/lib/utils";
import { upstashRedisInit } from "@/lib/upstash-redis";

export async function GET() {
  const key = keyNameByEnv("gotd_artwork");
  let data;
  let gotd;
  let newGotd = false;

  data = await fetch(`${process.env.upstashRedisRestUrl}/get/${key}`, {
    cache: "no-store",
    ...upstashRedisInit,
  });
  gotd = JSON.parse(await (await data.json()).result);

  if (!gotd) {
    data = await fetch(`${process.env.serverUrl}/gotd/2`, {
      cache: "no-store",
    });
    gotd = await data.json();
  }

  const { imageUrl } = gotd.info;
  const { modeId, modes, id } = gotd;
  newGotd = checkNewGotd(gotd.scheduled);

  return NextResponse.json({
    gotd: { id, modeId, modes, imageUrl },
    newGotd,
  });
}
