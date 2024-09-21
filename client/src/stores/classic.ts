import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Guess, Guesses } from "@/types/games";
import { Gotd } from "@/types/gotd";
import { Mode } from "@/types/modes";
import getIt from "~/src/lib/get-it";

export interface ClassicSlice {
  gotdId: number;
  imageUrl: string;
  name: string;
  lives: number;
  livesLeft: number;
  guesses: Guesses;
  played: boolean;
  won: boolean;
  pixelation: number;
  pixelationStep: number;
  mode: Mode;
  updateLivesLeft: () => void;
  updateGuesses: (arg0: Guess | null) => void;
  getLivesLeft: () => number;
  getGuesses: () => Guesses;
  markAsPlayed: () => void;
  markAsWon: () => void;
  getPlayed: () => boolean;
  setPixelation: () => void;
  removePixelation: () => void;
  setGotd: (arg0: Gotd) => void;
  getName: () => string;
  setName: (arg0: string) => void;
  fetchGotd: () => void;
  resetPlay: () => void;
}

export const initialState = {
  gotdId: 0,
  imageUrl: "/placeholder.jpg",
  name: "",
  lives: 0,
  livesLeft: 0,
  guesses: [],
  played: false,
  won: false,
  pixelation: 0,
  pixelationStep: 0,
  mode: null as unknown as Mode,
};

const zClassic = create(
  persist<ClassicSlice>(
    (set, get) => ({
      ...initialState,
      updateLivesLeft: () => {
        const livesLeft = get().livesLeft;
        set({ livesLeft: livesLeft - 1 });
      },
      updateGuesses: (guess: Guess | null) => {
        const guesses = get().guesses;
        if (guess) {
          set({ guesses: [...guesses, guess] });
        }
      },
      getLivesLeft: () => get().livesLeft,
      getGuesses: () => get().guesses,
      markAsPlayed: () => {
        set({ played: true });
      },
      getPlayed: () => get().played,
      markAsWon: () => {
        set({ won: true });
      },
      setPixelation: () => {
        const pixelation = get().pixelation;
        const pixelationStep = get().pixelationStep;
        set({ pixelation: pixelation - pixelationStep });
      },
      removePixelation: () => {
        set({ pixelation: 0 });
      },
      setGotd: (gotd: Gotd) => {
        const { imageUrl, modes, id } = gotd;
        const { label, lives, pixelation, pixelationStep } = modes;
        set({
          gotdId: id,
          imageUrl,
          name: label,
          lives,
          livesLeft: lives,
          pixelation,
          pixelationStep,
          mode: modes,
        });
      },
      setName: (name: string) => {
        set({ name });
      },
      getName: () => get().name,
      fetchGotd: async () => {
        try {
          const res = await getIt("classic");
          const { gotd, newGotd } = await res.json();

          if (newGotd) {
            get().resetPlay();
          }

          if (gotd && (newGotd || !get().gotdId)) {
            get().setGotd(gotd);
          }
        } catch (error) {
          console.error("Failed to set gotd (classic):", error);
        }
      },
      resetPlay: () => {
        set({ ...initialState });
      },
    }),
    { name: "zclassic" }
  )
);

zClassic.getState().fetchGotd();

export default zClassic;
