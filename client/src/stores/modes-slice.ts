import { Mode, Modes } from "@/types/modes";

export interface modesSlice {
  modes: Modes;
  fetchModes: () => void;
  getMode: (arg0: number) => Mode;
}

export const defaultModesSlice = {
  modes: null,
};

const createModesSlice = (
  set: (arg0: unknown) => void,
  get: () => unknown
) => ({
  ...defaultModesSlice,
  fetchModes: async () => {
    const res = await fetch("/api/modes");
    const modes = await res.json();

    set({ modes });
  },
  getMode: async (modeId: number) => {
    const modes = await (get() as { modes: Modes }).modes;
    const mode = modes?.find((val: Mode) => val.id === modeId);
    return mode;
  },
});

export default createModesSlice;
