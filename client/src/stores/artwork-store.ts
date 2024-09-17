import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Game, Games, Guess, Guesses } from "@/types/games";
import { Gotd } from "@/types/gotd";
import { Mode } from "@/types/modes";

export interface artworkStore {
  gotdId: number;
  artworkUrl: string;
  imageUrl: string;
  name: string;
  lives: number;
  livesLeft: number;
  guesses: Guesses;
  played: boolean;
  won: boolean;
  date: Date;
  mode: Mode;
  getGotdId: () => number;
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
  setImageUrl: (arg0: string) => void;
  getName: () => string;
  setName: (arg0: string) => void;
  resetPlay: () => void;
}

export const defaultArtwork = {
  gotdId: 0,
  artworkUrl: "/placeholder.jpg",
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
  mode: null,
};

const useArtworkStore = create(
  persist(
    (set: (arg0: unknown) => void, get: () => unknown) => ({
      ...defaultArtwork,
      getGotdId: () => (get() as { gotdId: number }).gotdId,
      updateLivesLeft: () => {
        const livesLeft = (get() as { livesLeft: number }).livesLeft;
        set({ livesLeft: livesLeft - 1 });
      },
      updateGuesses: (guess: Game) => {
        const guesses = (get() as { guesses: Guesses }).guesses;
        set({ guesses: [...guesses, guess] });
      },
      getLivesLeft: () => (get() as { livesLeft: number }).livesLeft,
      getGuesses: () => (get() as { guesses: Games }).guesses,
      markAsPlayed: () => {
        set({ played: true });
      },
      getPlayed: () => (get() as { played: boolean }).played,
      markAsWon: () => {
        set({ won: true });
      },
      setPixelation: () => {
        const pixelation = (get() as { pixelation: number }).pixelation;
        const pixelationStep = (get() as { pixelationStep: number })
          .pixelationStep;
        set({ pixelation: pixelation - pixelationStep });
      },
      removePixelation: () => {
        set({ pixelation: 0 });
      },
      setGotd: (gotd: Gotd) => {
        const { artworkUrl, modes, id } = gotd;
        const { label, lives, pixelation, pixelationStep } = modes;
        set({ mode: modes });
        set({
          gotdId: id,
          artworkUrl,
          label,
          lives,
          livesLeft: lives,
          pixelation,
          pixelationStep,
        });
      },
      setImageUrl: (imageUrl: string) => {
        set({ imageUrl });
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
