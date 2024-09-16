import { create } from "zustand";
import { persist } from "zustand/middleware";
import createGamesSlice from "@/stores/games-slice";
import createModesSlice from "@/stores/modes-slice";
// import createClassicUnlimitedSlice, {
//   ClassicUnlimitedSlice,
// } from "@/stores/classic-unlimited-slice";

const useGaeldleStore = create(
  persist(
    (set, get) => ({
      ...createGamesSlice(set, get),
      ...createModesSlice(set, get),
      // ...createClassicUnlimitedSlice(set, get as () => ClassicUnlimitedSlice),
    }),
    { name: "main-gaeldle-store" }
  )
);

export default useGaeldleStore;
