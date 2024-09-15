import { NextResponse } from "next/server";
import { checkNewGotd, genKey } from "@/lib/utils";
import { upstashRedisInit } from "@/lib/upstash-redis";

export async function GET() {
  const key = genKey("specifications");
  let data;
  let gotd;
  let newGotd = false;

  data = await fetch(`${process.env.upstashRedisRestUrl}/get/${key}`, {
    cache: "no-store",
    ...upstashRedisInit,
  });
  gotd = JSON.parse(await (await data.json()).result);

  if (!gotd) {
    data = await fetch(`${process.env.serverUrl}/gotd/4`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${process.env.bearerToken}`,
      },
    });
    gotd = await data.json();
  }

  const { modeId, modes, id } = gotd;
  newGotd = checkNewGotd(gotd.scheduled);

  return NextResponse.json({
    gotd: { id, modeId, modes },
    newGotd,
  });
}
