import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Games } from "@/types/games";
import getIt from "~/src/lib/get-it";

export interface GamesSlice {
  games: Games;
  setGames: () => void;
  getGames: () => Games;
}

export const defaultGamesSlice = {
  games: [],
};

const zGames = create(
  persist<GamesSlice>(
    (set, get) => ({
      ...defaultGamesSlice,
      setGames: async () => {
        const res = await getIt("games");
        const games = await res.json();
        set({ games });
      },
      getGames: () => get().games,
    }),
    { name: "zgames" }
  )
);

zGames.getState().setGames();

export default zGames;
