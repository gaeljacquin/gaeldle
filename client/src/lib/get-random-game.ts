"use server";

import { Gotd } from "@/types/gotd";
import { upstashRedisInit } from "./upstash-redis";
import { keyNameByEnv } from "./utils";

export async function getRandomGame() {
  let response;
  let data;
  const key = keyNameByEnv("games2");

  try {
    response = await fetch(`${process.env.upstashRedisRestUrl}/get/${key}`, {
      cache: "no-store",
      ...upstashRedisInit,
    });
    data = JSON.parse(await (await response.json()).result);

    if (!data) {
      response = await fetch(`${process.env.serverUrl}/games/random/5`);
      data = await response.json();
    }
  } catch (error) {
    console.log("Something went wrong: ", error);
  }

  return data as Gotd;
}
