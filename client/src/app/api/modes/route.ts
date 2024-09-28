import { NextResponse } from "next/server";
import { upstashRedisInit } from "@/lib/upstash-redis";
import { getLastSegment, gSeconds, genKey } from "~/src/lib/server-constants";

export async function GET(request: Request) {
  const lastSegment = getLastSegment(request.url);
  const key = genKey(lastSegment);
  let response;
  let data;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), gSeconds);

    response = await fetch(`${process.env.serverUrl}/${lastSegment}`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${process.env.bearerToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    data = await response.json();
  } catch (error) {
    if (
      (error as Error).name === "AbortError" ||
      (error as Error).name === "TypeError"
    ) {
      response = await fetch(`${process.env.upstashRedisRestUrl}/get/${key}`, {
        cache: "no-store",
        ...upstashRedisInit,
      });

      data = JSON.parse(await (await response.json()).result);
    } else {
      throw error;
    }
  }

  return NextResponse.json(data);
}
