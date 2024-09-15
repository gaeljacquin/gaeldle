import { upstashRedisInit } from "@/lib/upstash-redis";
import { NextResponse } from "next/server";
import { genKey } from "~/src/lib/utils";

export async function GET() {
  let response;
  let data;
  const key = genKey("modes");

  response = await fetch(`${process.env.upstashRedisRestUrl}/get/${key}`, {
    cache: "no-store",
    ...upstashRedisInit,
  });
  data = JSON.parse(await (await response.json()).result);

  if (!data) {
    response = await fetch(`${process.env.serverUrl}/modes`, {
      headers: {
        Authorization: `Bearer ${process.env.bearerToken}`,
      },
    });
    data = await response.json();
  }

  return NextResponse.json(data);
}
