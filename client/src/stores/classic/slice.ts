import { Game } from "@/types/game";
import { Gotd } from "@/types/gotd";

export interface classicSlice {
  name: string;
  igdbId: number;
  imageUrl: string;
  info: {
    [key: string]: unknown;
  };
  totalAttempts: number;
  attemptsLeft: number;
  guesses: Game[];
  played: boolean;
  won: boolean;
  date: Date;
  updateAttempts: () => void;
  updateGuesses: (arg0: Game | null) => void;
  markAsPlayed: () => void;
  markAsWon: () => void;
  pixelation: number;
  pixelationStep: number;
  setPixelation: () => void;
  removePixelation: () => void;
  setGotd: (arg0: Gotd) => void;
}

export const defaultClassic = {
  name: "Fire Emblem: Awakening",
  igdbId: 1443,
  imageUrl: "https://images.igdb.com/igdb/image/upload/t_720p/co668y.webp",
  info: null,
  totalAttempts: 5,
  attemptsLeft: 5,
  guesses: [],
  played: false,
  won: false,
  date: "2024-08-25T19:43:04.202Z",
  pixelation: 20,
  pixelationStep: 4,
};

const createClassicSlice = (set: (arg0: unknown) => void) => ({
  ...defaultClassic,
  updateAttempts: () =>
    set((state: classicSlice) => ({ attemptsLeft: state.attemptsLeft - 1 })),
  updateGuesses: (guess: Game) =>
    set((state: classicSlice) => ({ guesses: [...state.guesses, guess] })),
  markAsPlayed: () => {
    set({ played: true });
  },
  markAsWon: () => {
    set({ won: true });
  },
  setPixelation: () =>
    set((state: classicSlice) => ({
      pixelation: state.pixelation - state.pixelationStep,
    })),
  removePixelation: () => {
    set({ pixelation: 0 });
  },
  setGotd: (gotd: Gotd) => {
    const { igdbId, games } = gotd;
    const { name, imageUrl, info } = games;
    set({ name, igdbId, imageUrl, info });
  },
});

export default createClassicSlice;
