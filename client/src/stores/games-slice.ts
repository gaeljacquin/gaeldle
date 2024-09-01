import { Games } from "@/types/games";

export interface gamesSlice {
  games: Games;
  setGames: (arg0: Games) => void;
}

export const defaultGamesSlice = {
  games: [
    {
      name: "Fire Emblem: Awakening",
      igdbId: 1443,
    },
  ],
};

const createGamesSlice = (set: (arg0: unknown) => void) => ({
  ...defaultGamesSlice,
  setGames: (games: Games) => {
    set({ games });
  },
});

export default createGamesSlice;
