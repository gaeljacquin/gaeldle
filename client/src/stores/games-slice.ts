import { Games } from "@/types/games";

export interface gamesSlice {
  games: Games;
  setGames: () => void;
  getGames: () => Games;
}

export const defaultGamesSlice = {
  games: [],
};

const createGamesSlice = (
  set: (arg0: unknown) => void,
  get: () => unknown
) => ({
  ...defaultGamesSlice,
  setGames: async () => {
    const res = await fetch("/api/games");
    const games = await res.json();
    set({ games });
  },
  getGames: () => (get() as { games: Games }).games,
});

export default createGamesSlice;
