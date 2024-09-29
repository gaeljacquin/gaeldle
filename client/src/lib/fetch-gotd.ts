import { getLastSegment, genKey, today, gSeconds } from "./server-constants";
import { upstashRedisInit } from "~/src/lib/upstash-redis";

export async function fetchGotd(modeId: number, requestUrl: string) {
  const lastSegment = getLastSegment(requestUrl);
  const key =
    genKey(lastSegment) + `-${today.start.toISOString().split("T")[0]}`;
  let data;
  let gotd;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), gSeconds);

    data = await fetch(`${process.env.serverUrl}/gotd/${modeId}`, {
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
      (error as Error).name.includes("TypeError")
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

  return gotd;
}
