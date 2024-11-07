import { Game } from '@/services/games';

export type Operator = '>' | '<';
export type OperatorEqual = Operator | '=';

export type GuessHilo = {
  nextGame: Partial<Game>;
  currentGame: Partial<Game>;
  operator: Operator;
  rightAnswer: boolean;
};

export type ZHilo = {
  streak: number;
  bestStreak: number;
  timeline: Partial<Game>[];
  guesses: GuessHilo[];
  // livesLeft: number;
  getStreak: () => number;
  getBestStreak: () => number;
  // getLivesLeft: () => number;
  setBestStreak: () => void;
  setStreak: (arg0: boolean) => void;
  getGuesses: () => GuessHilo[];
  updateGuesses: (arg0: GuessHilo[]) => void;
  getTimeline: () => Partial<Game>[];
  updateTimeline: (arg0: Partial<Game>[]) => void;
  // updateLivesLeft: () => void;
};
