import { Games } from "./games";

export type DailyStats = {
  gotdId: number;
  modeId: number;
  attempts: number;
  guesses: Games;
  found: boolean;
  info?: unknown[];
};