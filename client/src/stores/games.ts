import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { ZGames } from "@/types/zgames";
import getIt from "~/src/lib/get-it";

export const defaultGamesSlice = {
  games: [],
};

const zGames = create(
  persist(
    devtools<ZGames>((set, get) => ({
      ...defaultGamesSlice,
      setGames: async () => {
        const res = await getIt("games");
        const games = await res.json();
        set({ games });
      },
      getGames: () => get().games,
    })),
    { name: "zgames" }
  )
);

zGames.getState().setGames();

export default zGames;
