import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Game, Games, Guess, Guesses } from "@/types/games";
import { Gotd } from "@/types/gotd";
import { Mode } from "@/types/modes";

export interface keywordsStore {
  gotdId: number;
  imageUrl: string;
  keywords: string[];
  name: string;
  lives: number;
  livesLeft: number;
  guesses: Guesses;
  played: boolean;
  won: boolean;
  date: Date;
  numKeywords: number;
  mode: Mode;
  getGotdId: () => number;
  updateLivesLeft: () => void;
  updateGuesses: (arg0: Guess | null) => void;
  getLivesLeft: () => number;
  getGuesses: () => Games;
  markAsPlayed: () => void;
  markAsWon: () => void;
  getPlayed: () => boolean;
  updateKeywords: (arg0: string | null) => void;
  setGotd: (arg0: Gotd) => void;
  setImageUrl: (arg0: string) => void;
  getName: () => string;
  setName: (arg0: string) => void;
  resetPlay: () => void;
}

export const defaultKeywords = {
  gotdId: 0,
  imageUrl: "/placeholder.jpg",
  keywords: [],
  name: "",
  lives: 0,
  livesLeft: 0,
  guesses: [],
  played: false,
  won: false,
  date: "",
  numKeywords: 0,
  mode: null,
};

const useKeywordsStore = create(
  persist(
    (set: (arg0: unknown) => void, get: () => unknown) => ({
      ...defaultKeywords,
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
      updateKeywords: (keyword: string | null) => {
        if (keyword) {
          const newKeywords = keyword.split(",");
          const keywords = (get() as { keywords: string[] }).keywords;
          set({
            keywords: [...keywords, ...newKeywords],
          });
        }
      },
      setGotd: (gotd: Gotd) => {
        const { keyword, modes, id, numKeywords } = gotd;
        const { label, lives } = modes;
        set({ mode: modes });
        set({
          gotdId: id,
          keywords: [keyword],
          label,
          lives,
          livesLeft: lives,
          numKeywords,
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
        set({ ...defaultKeywords });
      },
    }),
    { name: "keywords-gaeldle-store" }
  )
);

export default useKeywordsStore;
