import { Modes } from './modes';
import { Other, Others } from './other';

export type Guess = {
  igdbId: number;
  name: string;
};

export type Game = Guess & {
  games: Other;
  imageUrl: string;
  info: Other;
  modes: Modes;
  keywords: Others;
};

export type Guesses = (Guess | null)[];

export type Games = Game[];
