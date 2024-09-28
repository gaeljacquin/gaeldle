import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { ZGames } from "@/types/zgames";
import { absoluteUrl } from "@/lib/client-constants";

export const initialState = {
  games: [],
};

const zGames = create(
  persist(
    devtools<ZGames>((set, get) => ({
      ...initialState,
      setGames: async () => {
        const endpoint = absoluteUrl("/api/games");
        const res = await fetch(endpoint);
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
