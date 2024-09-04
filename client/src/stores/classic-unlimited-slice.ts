import { Game, Games } from "@/types/games";
import { Mode } from "@/types/modes";
import shuffleList from "@/lib/shuffle-list";
import { modesSlice } from "./modes-slice";

export interface classicUnlimitedSlice {
  game: {
    name: string;
    igdbId: number;
    imageUrl: string;
    info: {
      [key: string]: unknown;
    };
  };
  lives: number;
  livesLeft: number;
  guesses: Games;
  played: boolean;
  won: boolean;
  date: Date;
  updateLivesLeft: () => void;
  updateGuesses: (arg0: Game | null) => void;
  getLivesLeft: () => number;
  getGuesses: () => Games;
  markAsPlayed: () => void;
  markAsWon: () => void;
  pixelation: number;
  pixelationStep: number;
  setPixelation: () => void;
  removePixelation: () => void;
  setRandomGame: (arg0: Games) => void;
}

export const defaultClassicUnlimited = {
  game: {
    name: "",
    igdbId: 0,
    imageUrl: "/placeholder.jpg",
    info: null,
  },
  lives: 0,
  livesLeft: 0,
  guesses: [],
  played: false,
  won: false,
  date: "",
  pixelation: 0,
  pixelationStep: 0,
};

const createClassicUnlimitedSlice = (
  set: (arg0: unknown) => void,
  get: () => unknown
) => ({
  ...defaultClassicUnlimited,
  updateLivesLeft: () =>
    set((state: classicUnlimitedSlice) => ({
      livesLeft: state.livesLeft - 1,
    })),
  updateGuesses: (guess: Game) =>
    set((state: classicUnlimitedSlice) => ({
      guesses: [...state.guesses, guess],
    })),
  getLivesLeft: () => (get() as { livesLeft: number }).livesLeft,
  getGuesses: () => (get() as { guesses: Games }).guesses,
  markAsPlayed: () => {
    set({ played: true });
  },
  markAsWon: () => {
    set({ won: true });
  },
  setPixelation: () =>
    set((state: classicUnlimitedSlice) => ({
      pixelation: state.pixelation - state.pixelationStep,
    })),
  removePixelation: () => {
    set({ pixelation: 0 });
  },
  setRandomGame: (games: Games) => {
    set((state: classicUnlimitedSlice & modesSlice) => {
      const { lives, pixelation, pixelationStep } =
        state.modes.find((val: Mode) => val.id === 5) ?? {};
      const shuffledGames = shuffleList(games);
      const randomGame = shuffledGames[0] as Game;

      return {
        game: randomGame,
        lives,
        livesLeft: lives,
        pixelation,
        pixelationStep,
        played: false,
        won: false,
        guesses: [],
      };
    });
  },
});

export default createClassicUnlimitedSlice;
