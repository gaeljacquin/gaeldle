import { Guesses } from "./games";

export type UnlimitedStats = {
  igdbId: number;
  modeId: number;
  attempts: number;
  guesses: Guesses;
  found: boolean;
  info?: unknown[];
};
