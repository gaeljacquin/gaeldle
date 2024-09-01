import { Games } from "./games";

export type UnlimitedStats = {
  igdbId: number;
  modeId: number;
  attempts: number;
  guesses: Games;
  found: boolean;
  info?: unknown[];
};
