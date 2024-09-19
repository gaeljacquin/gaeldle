import { NextResponse } from "next/server";
import { upstashRedisInit } from "@/lib/upstash-redis";
import { genKey } from "~/src/lib/utils";

export async function GET() {
  const slug = "games";
  const gSeconds = 10000;
  const key = genKey(slug);
  let response;
  let data;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), gSeconds);

    response = await fetch(`${process.env.serverUrl}/${slug}`, {
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
