import { Modes } from "@/types/modes";

export interface modesSlice {
  modes: Modes;
  fetchModes: () => void;
}

export const defaultModesSlice = {
  modes: null,
};

const createModesSlice = (set: (arg0: unknown) => void) => ({
  ...defaultModesSlice,
  fetchModes: async () => {
    const res = await fetch("/api/modes");
    const modes = await res.json();

    set({ modes });
  },
});

export default createModesSlice;
