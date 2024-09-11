import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Game, Games, Guess, Guesses } from "@/types/games";
import { Gotd } from "@/types/gotd";

export interface artworkStore {
  gotdId: number;
  imageUrl: string;
  name: string;
  lives: number;
  livesLeft: number;
  guesses: Guesses;
  played: boolean;
  won: boolean;
  date: Date;
  updateLivesLeft: () => void;
  updateGuesses: (arg0: Guess | null) => void;
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
  getName: () => string;
  setName: (arg0: string) => void;
  resetPlay: () => void;
}

export const defaultArtwork = {
  gotdId: 0,
  imageUrl: "/placeholder.jpg",
  name: "",
  lives: 0,
  livesLeft: 0,
  guesses: [],
  played: false,
  won: false,
  date: "",
  pixelation: 0,
  pixelationStep: 0,
};

const useArtworkStore = create(
  persist(
    (set: (arg0: unknown) => void, get: () => unknown) => ({
      ...defaultArtwork,
      updateLivesLeft: () =>
        set((state: artworkStore) => ({ livesLeft: state.livesLeft - 1 })),
      updateGuesses: (guess: Game) =>
        set((state: artworkStore) => ({ guesses: [...state.guesses, guess] })),
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
        set((state: artworkStore) => ({
          pixelation: state.pixelation - state.pixelationStep,
        })),
      removePixelation: () => {
        set({ pixelation: 0 });
      },
      setGotd: (gotd: Gotd) => {
        const { imageUrl, modes, id } = gotd;
        const { label, lives, pixelation, pixelationStep } = modes;
        set({
          gotdId: id,
          imageUrl,
          label,
          lives,
          livesLeft: lives,
          pixelation,
          pixelationStep,
        });
      },
      setName: (name: string) => {
        set({ name });
      },
      getName: () => (get() as { name: string }).name,
      resetPlay: () => {
        set({ played: false, won: false, guesses: [] });
      },
    }),
    { name: "artwork-gaeldle-store" }
  )
);

export default useArtworkStore;
