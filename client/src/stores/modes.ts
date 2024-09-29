import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Mode } from "@/types/modes";
import { ZModes } from "@/types/zmodes";

export const initialState = {
  modes: [],
};

const zModes = create(
  persist(
    devtools<ZModes>((set, get) => ({
      ...initialState,
      setModes: async () => {
        const endpoint = "/api/modes";
        const res = await fetch(endpoint);
        const modes = await res.json();
        set({ modes });
      },
      getMode: (modeId: number) => {
        const modes = get().modes;
        const mode = modes.find((val: Mode) => val.id === modeId);

        return mode;
      },
      getModeBySlug: (path: string) => {
        const modes = get().modes;
        const slug = path.split("/")[1];
        const mode = modes.find((val: Mode) => val.mode === slug);

        return mode;
      },
    })),
    { name: "zmodes" }
  )
);

zModes.getState().setModes();

export default zModes;
