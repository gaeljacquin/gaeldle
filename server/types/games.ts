import { Modes } from './modes';

export type Guess = {
  igdbId: number;
  name: string;
};

export type Game = Guess & {
  games: { [key: string]: unknown };
  imageUrl: string;
  info: { [key: string]: unknown };
  modes: Modes;
  keywords: { [key: string]: unknown }[];
};

export type Guesses = (Guess | null)[];

export type Games = Game[];
