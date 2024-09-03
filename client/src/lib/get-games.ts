"use server";

import { Games } from "@/types/games";
import { upstashRedisInit } from "./upstash-redis";
import { keyNameByEnv } from "./utils";

export async function getGames() {
  let response;
  let data;
  const key = keyNameByEnv("games");

  try {
    response = await fetch(`${process.env.upstashRedisRestUrl}/get/${key}`, {
      cache: "no-store",
      ...upstashRedisInit,
    });
    data = JSON.parse(await (await response.json()).result);

    if (!data) {
      response = await fetch(`${process.env.serverUrl}/games`);
      data = await response.json();
    }
  } catch (error) {
    console.log("Something went wrong: ", error);
  }

  return data as Games;
}
