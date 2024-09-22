import { Games } from "@/types/games";

export type ZGames = {
  games: Games;
  setGames: () => void;
  getGames: () => Games;
};
