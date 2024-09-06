import { NextResponse } from "next/server";
import { checkNewGotd, keyNameByEnv } from "@/lib/utils";
import { upstashRedisInit } from "@/lib/upstash-redis";

export async function GET() {
  const key = keyNameByEnv("gotd_classic");
  let data;
  let gotd;
  let newGotd = false;

  data = await fetch(`${process.env.upstashRedisRestUrl}/get/${key}`, {
    cache: "no-store",
    ...upstashRedisInit,
  });
  gotd = JSON.parse(await (await data.json()).result);

  if (!gotd) {
    console.log("there");
    data = await fetch(`${process.env.serverUrl}/gotd/1`, {
      cache: "no-store",
    });
    gotd = await data.json();
  }

  newGotd = checkNewGotd(gotd.scheduled);

  return NextResponse.json({ gotd, newGotd });
}
