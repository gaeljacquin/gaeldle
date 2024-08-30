import { Modes } from "@/types/mode";

export interface modesSlice {
  modes: Modes;
  setModes: (arg0: Modes) => void;
}

export const defaultModesSlice = {
  modes: [],
};

const createModesSlice = (set: (arg0: unknown) => void) => ({
  ...defaultModesSlice,
  setModes: (modes: Modes) => {
    set({ modes });
  },
});

export default createModesSlice;
