"use server";

import { Games } from "@/types/game";

export async function getGames() {
  const response = await fetch(`${process.env.serverUrl}/games`);
  const data = await response.json();

  return data as Games;
}
