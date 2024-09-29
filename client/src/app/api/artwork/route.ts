import { NextResponse } from "next/server";
import { upstashRedisInit } from "@/lib/upstash-redis";
import {
  getLastSegment,
  gSeconds,
  genKey,
  nextDay,
} from "~/src/lib/server-constants";

export async function GET(request: Request) {
  const slug = 2;
  const lastSegment = getLastSegment(request.url);
  const key = genKey(lastSegment) + `-${nextDay.toISOString().split("T")[0]}`;
  let data;
  let gotd;

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

  return NextResponse.json({
    gotd: { id, modeId, modes, artworkUrl },
  });
}
