export type Guess = {
  igdbId: number;
  name: string;
};

export type Game = Guess & {
  imageUrl: string;
};

export type Guesses = (Guess | null)[];
export type Games = Game[];
