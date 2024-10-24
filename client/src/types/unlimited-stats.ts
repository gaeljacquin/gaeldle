import { Games, Guesses } from "@/types/games";
import { GuessHilo } from "@/types/zhilo";

export type UnlimitedStats = {
  igdbId?: number;
  modeId: number;
  attempts: number;
  found: boolean;
  info?: unknown;
};

export type TimelineStats = UnlimitedStats & {
  guesses: Games[];
};

export type CoverStats = UnlimitedStats & {
  guesses: Guesses;
};

export type HiloStats = UnlimitedStats & {
  guesses: GuessHilo[];
};
