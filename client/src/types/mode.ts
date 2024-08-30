export type Mode = {
  id: number;
  mode: string;
  label: string;
  description: string;
  active: boolean;
  levelId: number;
  lives: number;
  pixelation: number;
  pixelationStep: number;
};

export type Modes = Mode[];
