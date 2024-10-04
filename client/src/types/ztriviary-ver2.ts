import { Game, Games } from "@/types/games";

export type ZTriviaryVer2 = {
  dummyOnLoad: boolean;
  lives: number;
  livesLeft: number;
  nextGame: Partial<Game>;
  played: boolean;
  streak: number;
  maxStreak: number;
  submitButtonText: string;
  timeline: Games;
  won: boolean;
  getLivesLeft: () => number;
  getMaxStreak: () => number;
  getPlayed: () => boolean;
  getStreak: () => number;
  getTimeline: () => unknown[];
  markAsPlayed: () => void;
  markAsWon: () => void;
  resetPlay: () => void;
  setMaxStreak: () => void;
  setStreak: (arg0: boolean) => void;
  submitAnswer: () => void;
  updateLivesLeft: () => void;
  updateTimeline: (arg0: Games) => void;
};
