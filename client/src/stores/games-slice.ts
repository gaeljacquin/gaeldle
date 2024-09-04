import { Games } from "@/types/games";

export interface gamesSlice {
  games: Games;
  setGames: (arg0: Games) => void;
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
  setGames: (games: Games) => {
    set({ games });
  },
  getGames: () => (get() as { games: Games }).games,
});

export default createGamesSlice;
