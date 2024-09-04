import { create } from "zustand";
import { persist } from "zustand/middleware";
import createGamesSlice from "@/stores/games-slice";
import createModesSlice from "@/stores/modes-slice";
import createClassicUnlimitedSlice from "@/stores/classic-unlimited-slice";

const useGaeldleStore = create(
  persist(
    (get, set) => ({
      ...createGamesSlice(get, set),
      ...createModesSlice(get),
      ...createClassicUnlimitedSlice(get, set),
    }),
    { name: "main-gaeldle-store" }
  )
);

export default useGaeldleStore;
