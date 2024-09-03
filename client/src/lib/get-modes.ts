"use server";

import { Modes } from "@/types/modes";
import { upstashRedisInit } from "./upstash-redis";
import { keyNameByEnv } from "./utils";

export default async function getModes() {
  let response;
  let data;
  const key = keyNameByEnv("modes");

  try {
    response = await fetch(`${process.env.upstashRedisRestUrl}/get/${key}`, {
      cache: "no-store",
      ...upstashRedisInit,
    });
    data = JSON.parse(await (await response.json()).result);

    if (!data) {
      response = await fetch(`${process.env.serverUrl}/modes`);
      data = await response.json();
    }
  } catch (error) {
    console.log("Something went wrong: ", error);
  }

  return data as Modes;
}
