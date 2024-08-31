import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Game } from "@/types/game";
import { Gotd } from "@/types/gotd";

export interface classicStore {
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
  setGotd: (arg0: Gotd) => void;
}

export const defaultClassic = {
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

const useClassicStore = create(
  persist(
    (set: (arg0: unknown) => void) => ({
      ...defaultClassic,
      updateLives: () =>
        set((state: classicStore) => ({ livesLeft: state.livesLeft - 1 })),
      updateGuesses: (guess: Game) =>
        set((state: classicStore) => ({ guesses: [...state.guesses, guess] })),
      markAsPlayed: () => {
        set({ played: true });
      },
      markAsWon: () => {
        set({ won: true });
      },
      setPixelation: () =>
        set((state: classicStore) => ({
          pixelation: state.pixelation - state.pixelationStep,
        })),
      removePixelation: () => {
        set({ pixelation: 0 });
      },
      setGotd: (gotd: Gotd) => {
        const { igdbId, games, modes } = gotd;
        const { name, imageUrl, info } = games;
        const { label, lives, pixelation, pixelationStep } = modes;
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
        });
      },
    }),
    { name: "classic-gaeldle-store" }
  )
);

export default useClassicStore;
