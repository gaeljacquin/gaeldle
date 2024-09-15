import { NextResponse, NextRequest } from "next/server";
import { checkNewGotd, genKey } from "@/lib/utils";
// import { upstashRedisInit } from "@/lib/upstash-redis";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.redirect(new URL("/api", request.url));
  }

  // const key = genKey("classic");
  let data;
  let gotd;
  let newGotd = false;

  // data = await fetch(`${process.env.upstashRedisRestUrl}/get/${key}`, {
  //   cache: "no-store",
  //   ...upstashRedisInit,
  // });
  // gotd = JSON.parse(await (await data.json()).result);

  // if (!gotd) {
  data = await fetch(`${process.env.serverUrl}/gotd/dev/1`, {
    cache: "no-store",
  });
  gotd = await data.json();
  // }

  const { imageUrl } = gotd.games;
  const { modeId, modes, id } = gotd;
  // newGotd = checkNewGotd(gotd.scheduled);
  newGotd = false;

  return NextResponse.json({
    gotd: { id, modeId, modes, imageUrl },
    newGotd,
  });
}
