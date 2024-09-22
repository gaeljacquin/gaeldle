import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Mode } from "@/types/modes";
import { ZModes } from "@/types/zmodes";
import getIt from "~/src/lib/get-it";

export const defaultModesSlice = {
  modes: [],
};

const zModes = create(
  persist(
    devtools<ZModes>((set, get) => ({
      ...defaultModesSlice,
      setModes: async () => {
        const res = await getIt("modes");
        const modes = await res.json();

        set({ modes });
      },
      getMode: (modeId: number) => {
        const modes = get().modes;
        const mode = modes.find((val: Mode) => val.id === modeId);

        return mode;
      },
    })),
    { name: "zmodes" }
  )
);

zModes.getState().setModes();

export default zModes;
