import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Game, Games } from "@/types/game";
import { Gotd } from "@/types/gotd";

export interface classicStore {
  name: string;
  igdbId: number;
  gotdId: number;
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
  updateLivesLeft: () => void;
  updateGuesses: (arg0: Game | null) => void;
  getLivesLeft: () => number;
  getGuesses: () => Games;
  markAsPlayed: () => void;
  markAsWon: () => void;
  getPlayed: () => boolean;
  pixelation: number;
  pixelationStep: number;
  setPixelation: () => void;
  removePixelation: () => void;
  setGotd: (arg0: Gotd) => void;
}

export const defaultClassic = {
  name: "",
  igdbId: 0,
  gotdId: 0,
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
    (set: (arg0: unknown) => void, get: () => unknown) => ({
      ...defaultClassic,
      updateLivesLeft: () =>
        set((state: classicStore) => ({ livesLeft: state.livesLeft - 1 })),
      updateGuesses: (guess: Game) =>
        set((state: classicStore) => ({ guesses: [...state.guesses, guess] })),
      getLivesLeft: () => (get() as { livesLeft: number }).livesLeft,
      getGuesses: () => (get() as { guesses: Games }).guesses,
      markAsPlayed: () => {
        set({ played: true });
      },
      getPlayed: () => (get() as { played: boolean }).played,
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
        const { igdbId, games, modes, id } = gotd;
        const { name, imageUrl, info } = games;
        const { label, lives, pixelation, pixelationStep } = modes;
        set({
          name,
          igdbId,
          gotdId: id,
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
