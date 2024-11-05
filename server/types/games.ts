import { Modes } from '@/types/modes';
import { Other, Others } from '@/types/other';

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
  franchises?: Others;
  game_engines?: Others;
  game_modes?: Others;
  genres?: Others;
  involved_companies?: Others;
  platforms?: Others;
  player_perspectives?: Others;
  release_dates?: Others;
  themes?: Others;
  frd?: number;
  frdFormatted: string;
  correctIndex?: number | null;
};

export type Guesses = (Guess | null)[];

export type Games = Game[];
