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
  getStreak: () => number;
  getBestStreak: () => number;
  setBestStreak: () => void;
  setStreak: (arg0: boolean) => void;
};
