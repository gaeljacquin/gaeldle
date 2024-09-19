import { NextResponse } from "next/server";
import { checkNewGotd, genKey } from "@/lib/utils";
import { upstashRedisInit } from "@/lib/upstash-redis";

export async function GET() {
  const slug = 2;
  const gSeconds = 10000;
  const key = genKey("artwork");
  let data;
  let gotd;
  let newGotd = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), gSeconds);

    data = await fetch(`${process.env.serverUrl}/gotd/${slug}`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${process.env.bearerToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    gotd = await data.json();
  } catch (error) {
    if (
      (error as Error).name === "AbortError" ||
      (error as Error).name === "TypeError"
    ) {
      data = await fetch(`${process.env.upstashRedisRestUrl}/get/${key}`, {
        cache: "no-store",
        ...upstashRedisInit,
      });
      gotd = JSON.parse(await (await data.json()).result);
    } else {
      throw error;
    }
  }

  const { imageUrl: artworkUrl } = gotd.info;
  const { modeId, modes, id } = gotd;
  newGotd = checkNewGotd(gotd.scheduled);

  return NextResponse.json({
    gotd: { id, modeId, modes, artworkUrl },
    newGotd,
  });
}
