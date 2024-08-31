"use server";

import { Gotd } from "@/types/gotd";

export async function getRandomGame() {
  const response = await fetch(`${process.env.serverUrl}/games/random/5`);
  const data = await response.json();

  return data as Gotd;
}
