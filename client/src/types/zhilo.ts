import { Game, Games } from "@/types/games";

export type ZHilo = {
  lives: number;
  livesLeft: number;
  nextGame: Partial<Game> | null;
  played: boolean;
  attempts: number;
  streak: number;
  bestStreak: number;
  won: boolean;
  getLivesLeft: () => number;
  getStreak: () => number;
  getBestStreak: () => number;
  getPlayed: () => boolean;
  getNextGame: () => Partial<Game> | null;
  markAsPlayed: () => void;
  markAsWon: () => void;
  resetPlay: () => void;
  setBestStreak: () => void;
  setStreak: (arg0: boolean) => void;
  updateLivesLeft: () => void;
};
