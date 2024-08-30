import { create } from "zustand";
import { persist } from "zustand/middleware";
import createGamesSlice from "@/stores/games-slice";
import createModesSlice from "@/stores/modes-slice";

const useGaeldleStore = create(
  persist(
    (config) => ({
      ...createGamesSlice(config),
      ...createModesSlice(config),
    }),
    { name: "main-gaeldle-store" }
  )
);

export default useGaeldleStore;
