export type Mode = {
  id: number;
  mode: string;
  label: string;
  description: string;
  active: boolean;
  levelId: number;
};

export type Modes = Mode[];
