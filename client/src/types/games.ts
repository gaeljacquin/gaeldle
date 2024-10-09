import { Modes } from "~/src/types/modes";
import { Other, Others } from "~/src/types/other";

export type Guess = {
  igdbId: number;
  name: string;
};

export type Game = Guess & {
  games?: Other;
  imageUrl: string;
  artworkUrl?: string;
  modes?: Modes;
  bgStatus?: string;
  frd: number;
  frdFormatted: string;
  correctIndex?: number;
  latestIndex?: number;
  proximity?: number;
};

export type Spec = {
  value?: string;
  values?: string[];
  specscn: string;
  arrowDir?: string;
};

export type Specs = {
  imageUrl: string;
  franchises: Spec;
  game_engines: Spec;
  game_modes: Spec;
  genres: Spec;
  platforms: Spec;
  player_perspectives: Spec;
  release_dates: Spec;
  themes: Spec;
};

export type Guesses = (Guess | null)[];

export type Games = Game[];

export type GuessWithSpecs = Guess & Specs;
