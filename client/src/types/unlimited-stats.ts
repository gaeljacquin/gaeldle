import { Games } from "./games";

export type UnlimitedStats = {
  igdbId?: number;
  modeId: number;
  attempts: number;
  found: boolean;
  info?: unknown;
};

export type TriviaryStats = UnlimitedStats & {
  guesses: Games[];
};

export type Triviary2Stats = Pick<UnlimitedStats, "modeId" | "found" | "info">;
