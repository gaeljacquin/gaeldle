import { create } from "zustand";

import { Game } from "@/types/game";
import { Gotd } from "@/types/gotd";
import { Mode } from "@/types/mode";

export interface classicUnlimitedStore {
  name: string;
  igdbId: number;
  imageUrl: string;
  info: {
    [key: string]: unknown;
  };
  lives: number;
  livesLeft: number;
  guesses: Game[];
  played: boolean;
  won: boolean;
  date: Date;
  updateLives: () => void;
  updateGuesses: (arg0: Game | null) => void;
  markAsPlayed: () => void;
  markAsWon: () => void;
  pixelation: number;
  pixelationStep: number;
  setPixelation: () => void;
  removePixelation: () => void;
  setRandomGame: (arg0: Gotd) => void;
}

export const defaultClassicUnlimited = {
  name: "",
  igdbId: 0,
  imageUrl: "/placeholder.jpg",
  info: null,
  lives: 0,
  livesLeft: 0,
  guesses: [],
  played: false,
  won: false,
  date: "",
  pixelation: 0,
  pixelationStep: 0,
};

const useClassicUnlimitedStore = create((set: (arg0: unknown) => void) => ({
  ...defaultClassicUnlimited,
  updateLives: () =>
    set((state: classicUnlimitedStore) => ({
      livesLeft: state.livesLeft - 1,
    })),
  updateGuesses: (guess: Game) =>
    set((state: classicUnlimitedStore) => ({
      guesses: [...state.guesses, guess],
    })),
  markAsPlayed: () => {
    set({ played: true });
  },
  markAsWon: () => {
    set({ won: true });
  },
  setPixelation: () =>
    set((state: classicUnlimitedStore) => ({
      pixelation: state.pixelation - state.pixelationStep,
    })),
  removePixelation: () => {
    set({ pixelation: 0 });
  },
  setRandomGame: (randomGame: Gotd) => {
    const { igdbId, imageUrl, info, name, mode } = randomGame;
    const { label, lives, pixelation, pixelationStep } = mode;
    set({
      name,
      igdbId,
      imageUrl,
      info,
      label,
      lives,
      livesLeft: lives,
      pixelation,
      pixelationStep,
      played: false,
      won: false,
      guesses: [],
    });
  },
}));

export default useClassicUnlimitedStore;
