import { GuessWithSpecs } from "~/src/types/games";
import { Gotd } from "~/src/types/gotd";

export type ZSpecs = {
  gotdId: number;
  imageUrl: string;
  name: string;
  lives: number;
  livesLeft: number;
  guesses: GuessWithSpecs[];
  played: boolean;
  won: boolean;
  summary: Partial<GuessWithSpecs>;
  updateLivesLeft: () => void;
  updateGuesses: (arg0: GuessWithSpecs | null) => void;
  getLivesLeft: () => number;
  getGuesses: () => GuessWithSpecs[];
  markAsPlayed: () => void;
  markAsWon: () => void;
  getPlayed: () => boolean;
  setGotd: (arg0: Gotd) => void;
  setImageUrl: (arg0: string) => void;
  getName: () => string;
  setName: (arg0: string) => void;
  getSummary: () => Partial<GuessWithSpecs>;
  setSummary: (arg0: Partial<GuessWithSpecs>) => void;
  fetchGotd: () => void;
  resetPlay: () => void;
};
