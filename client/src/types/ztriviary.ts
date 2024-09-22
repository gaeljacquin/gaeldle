import { Game, Games } from "@/types/games";

export type ZTriviary = {
  getTimeline: () => unknown[];
  getLivesLeft: () => number;
  getPlayed: () => boolean;
  timeline: Games;
  goodTimeline: Games;
  timelineOnLoad: Games;
  guesses: Games[];
  alreadyGuessed: boolean;
  lives: number;
  livesLeft: number;
  markAsPlayed: () => void;
  markAsWon: () => void;
  played: boolean;
  submitButtonText: string;
  resetPlay: () => void;
  updateTimeline: (arg0: Games) => void;
  updateGuesses: (arg0: Games) => void;
  updateLivesLeft: () => void;
  won: boolean;
  dummyOnLoad: boolean;
  submitAnswer: () => void;
  setLastGuess: () => void;
};
