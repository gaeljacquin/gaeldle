import { Category } from "./categories";
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
  types: Category;
  isNew: boolean;
};

export type Modes = Mode[];
