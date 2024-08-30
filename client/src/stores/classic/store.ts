import { create } from "zustand";
import { persist } from "zustand/middleware";
import createClassicSlice from "@/stores/classic/slice";

const useClassicStore = create(
  persist(
    (config) => ({
      ...createClassicSlice(config),
    }),
    { name: "classic-gaeldle-store" }
  )
);

export default useClassicStore;
