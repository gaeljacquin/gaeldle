import { Modes } from "~/src/types/modes";
import { Other, Others } from "~/src/types/other";

export type Guess = {
  igdbId: number;
  name: string;
};

export type Game = Guess & {
  games?: Other;
  imageUrl: string;
  modes?: Modes;
  keywords?: Others;
  franchises?: Others;
  game_engines?: Others;
  game_modes?: Others;
  genres?: Others;
  involved_companies?: Others;
  platforms?: Others;
  player_perspectives?: Others;
  release_dates?: string | number;
  themes?: Others;
};

export type Guesses = (Guess | null)[];

export type Games = Game[];
