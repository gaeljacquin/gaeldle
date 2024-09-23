import { Guesses, Guess } from "~/src/types/games";
import { Gotd } from "~/src/types/gotd";

export type ZKeywords = {
  gotdId: number;
  imageUrl: string;
  keywords: string[];
  name: string;
  lives: number;
  livesLeft: number;
  guesses: Guesses;
  played: boolean;
  won: boolean;
  numKeywords: number;
  updateLivesLeft: () => void;
  updateGuesses: (arg0: Guess | null) => void;
  getLivesLeft: () => number;
  getGuesses: () => Guesses;
  markAsPlayed: () => void;
  markAsWon: () => void;
  getPlayed: () => boolean;
  updateKeywords: (arg0: string | null) => void;
  setGotd: (arg0: Gotd) => void;
  setImageUrl: (arg0: string) => void;
  getName: () => string;
  setName: (arg0: string) => void;
  fetchGotd: () => void;
  resetPlay: () => void;
};
