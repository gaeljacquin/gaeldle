import { Games } from "@/types/games";

export interface gamesSlice {
  games: Games;
  setGames: (arg0: Games) => void;
}

export const defaultGamesSlice = {
  games: [],
};

const createGamesSlice = (set: (arg0: unknown) => void) => ({
  ...defaultGamesSlice,
  setGames: (games: Games) => {
    set({ games });
  },
});

export default createGamesSlice;
