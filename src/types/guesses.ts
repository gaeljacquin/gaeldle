export type Guess = {
  igdbId: number;
  name: string;
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

export type GuessWithSpecs = Guess & Specs;
