import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Guess, Guesses } from "@/types/games";
import { Gotd } from "@/types/gotd";
import { Mode } from "@/types/modes";
import getIt from "~/src/lib/get-it";

export interface ArtworkSlice {
  gotdId: number;
  artworkUrl: string;
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
  setImageUrl: (arg0: string) => void;
  getName: () => string;
  setName: (arg0: string) => void;
  fetchGotd: () => void;
  resetPlay: () => void;
}

export const initialState = {
  gotdId: 0,
  artworkUrl: "/placeholder.jpg",
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

const useArtworkSlice = create(
  persist<ArtworkSlice>(
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
        const { artworkUrl, modes, id } = gotd;
        const { lives, pixelation, pixelationStep } = modes;
        set({
          gotdId: id,
          artworkUrl,
          lives,
          livesLeft: lives,
          pixelation,
          pixelationStep,
          mode: modes,
        });
      },
      setImageUrl: (imageUrl: string) => {
        set({ imageUrl });
      },
      setName: (name: string) => {
        set({ name });
      },
      getName: () => get().name,
      fetchGotd: async () => {
        try {
          const res = await getIt("artwork");
          const { gotd } = await res.json();
          const currentGotdId = get().gotdId;

          if (!currentGotdId || currentGotdId !== gotd.id) {
            get().resetPlay();
            get().setGotd(gotd);
          }
        } catch (error) {
          console.error("Failed to set gotd (artwork):", error);
        }
      },
      resetPlay: () => {
        set({ ...initialState });
      },
    }),
    { name: "zartwork" }
  )
);

useArtworkSlice.getState().fetchGotd();

export default useArtworkSlice;
