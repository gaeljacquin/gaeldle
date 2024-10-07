import { Guesses } from "./games";

export type DailyStats = {
  gotdId: number;
  modeId: number;
  attempts: number;
  guesses: Guesses;
  found: boolean;
  info?: unknown;
  real?: boolean;
};
