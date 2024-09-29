import { Mode, Modes } from "@/types/modes";

export type ZModes = {
  modes: Modes;
  setModes: () => void;
  getMode: (arg0: number) => Mode | undefined;
  getModeBySlug: (arg0: string) => Mode | undefined;
};
