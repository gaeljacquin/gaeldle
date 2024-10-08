import { Games, Guesses } from "./games";

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
