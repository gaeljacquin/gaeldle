export type Guess = {
  igdbId: number;
  name: string;
};

export type Game = Guess & {
  imageUrl: string;
  info: { [key: string]: unknown };
};

export type Guesses = (Guess | null)[];

export type Games = Game[];
