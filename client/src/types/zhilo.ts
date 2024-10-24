import { Game, Games } from "@/types/games";

export type Operator = ">" | "<" | "=";

export type GuessHilo = {
  nextGame: Partial<Game>;
  currentGame: Partial<Game>;
  operator: Omit<Operator, "=">;
  rightAnswer: boolean;
};

export type ZHilo = {
  lives: number;
  livesLeft: number;
  nextGame: Partial<Game> | null;
  currentGame: Partial<Game> | null;
  played: boolean;
  streak: number;
  bestStreak: number;
  timeline: Partial<Game>[];
  won: boolean;
  operator: Operator;
  guesses: GuessHilo[];
  getLivesLeft: () => number;
  getStreak: () => number;
  getBestStreak: () => number;
  getPlayed: () => boolean;
  getTimeline: () => Partial<Game>[];
  getNextGame: () => Partial<Game> | null;
  markAsPlayed: () => void;
  markAsWon: () => void;
  resetPlay: () => void;
  setBestStreak: () => void;
  setStreak: (arg0: boolean) => void;
  updateLivesLeft: () => void;
  submitOperator: (arg0: Operator) => void;
};
