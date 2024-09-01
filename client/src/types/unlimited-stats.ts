import { Games } from "./game";

export type UnlimitedStats = {
  igdbId: number;
  modeId: number;
  attempts: number;
  guesses: Games;
  found: boolean;
  info?: unknown[];
};
