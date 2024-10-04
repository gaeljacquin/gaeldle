import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Game } from "../types/games";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function findCard(igdbId: number, daList: Partial<Game>[]) {
  const card = daList.find((card: Partial<Game>) => card.igdbId === igdbId);

  return card!;
}
