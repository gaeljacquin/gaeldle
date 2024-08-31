import { Categories } from "./categories";
import { Levels } from "./levels";

export type Mode = {
  id: number;
  mode: string;
  label: string;
  description: string;
  active: boolean;
  levelId: number;
  categoryId: number;
  lives: number;
  pixelation: number;
  pixelationStep: number;
  levels: Levels;
  types: Categories;
};

export type Modes = Mode[];
