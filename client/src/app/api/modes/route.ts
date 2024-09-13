import { upstashRedisInit } from "@/lib/upstash-redis";
import { keyNameByEnv } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  let response;
  let data;
  const key = keyNameByEnv("modes");

  response = await fetch(`${process.env.upstashRedisRestUrl}/get/${key}`, {
    cache: "no-store",
    ...upstashRedisInit,
  });
  data = JSON.parse(await (await response.json()).result);

  if (!data) {
    response = await fetch(`${process.env.serverUrl}/modes`);
    data = await response.json();
  }

  return NextResponse.json(data);
}