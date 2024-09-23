import { Guesses, Guess } from "~/src/types/games";
import { Gotd } from "~/src/types/gotd";

export type ZClassic = {
  gotdId: number;
  imageUrl: string;
  name: string;
  lives: number;
  livesLeft: number;
  guesses: Guesses;
  played: boolean;
  won: boolean;
  pixelation: number;
  pixelationStep: number;
  updateLivesLeft: () => void;
  updateGuesses: (arg0: Guess | null) => void;
  getLivesLeft: () => number;
  getGuesses: () => Guesses;
  markAsPlayed: () => void;
  markAsWon: () => void;
  getPlayed: () => boolean;
  setPixelation: () => void;
  removePixelation: () => void;
  setGotd: (arg0: Gotd) => void;
  getName: () => string;
  setName: (arg0: string) => void;
  fetchGotd: () => void;
  resetPlay: () => void;
};
