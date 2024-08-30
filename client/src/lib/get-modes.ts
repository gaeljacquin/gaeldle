"use server";

import { Modes } from "@/types/mode";

export default async function getModes() {
  const response = await fetch(`${process.env.serverUrl}/modes`);
  const data = await response.json();

  return data as Modes;
}
