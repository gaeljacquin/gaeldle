import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Mode, Modes } from "@/types/modes";
import getIt from "~/src/lib/get-it";

export interface ModesSlice {
  modes: Modes;
  setModes: () => void;
  getMode: (arg0: number) => Mode | undefined;
}

export const defaultModesSlice = {
  modes: [],
};

const zModes = create(
  persist<ModesSlice>(
    (set, get) => ({
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
    }),
    { name: "zmodes" }
  )
);

zModes.getState().setModes();

export default zModes;
