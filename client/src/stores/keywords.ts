import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Guess, Guesses } from "@/types/games";
import { Gotd } from "@/types/gotd";
import { Mode } from "@/types/modes";
import getIt from "~/src/lib/get-it";

export interface KeywordsSlice {
  gotdId: number;
  imageUrl: string;
  keywords: string[];
  name: string;
  lives: number;
  livesLeft: number;
  guesses: Guesses;
  played: boolean;
  won: boolean;
  numKeywords: number;
  mode: Mode;
  updateLivesLeft: () => void;
  updateGuesses: (arg0: Guess | null) => void;
  getLivesLeft: () => number;
  getGuesses: () => Guesses;
  markAsPlayed: () => void;
  markAsWon: () => void;
  getPlayed: () => boolean;
  updateKeywords: (arg0: string | null) => void;
  setGotd: (arg0: Gotd) => void;
  setImageUrl: (arg0: string) => void;
  getName: () => string;
  setName: (arg0: string) => void;
  fetchGotd: () => void;
  resetPlay: () => void;
}

export const initialState = {
  gotdId: 0,
  imageUrl: "/placeholder.jpg",
  keywords: [],
  name: "",
  lives: 0,
  livesLeft: 0,
  guesses: [],
  played: false,
  won: false,
  numKeywords: 0,
  mode: null as unknown as Mode,
};

const zKeywords = create(
  persist<KeywordsSlice>(
    (set, get) => ({
      ...initialState,
      updateLivesLeft: () => {
        const livesLeft = get().livesLeft;
        set({ livesLeft: livesLeft - 1 });
      },
      updateGuesses: (guess: Guess | null) => {
        const guesses = get().guesses;
        set({ guesses: [...guesses, guess] });
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
      updateKeywords: (keyword: string | null) => {
        if (keyword) {
          const newKeywords = keyword.split(",");
          const keywords = get().keywords;
          set({
            keywords: [...keywords, ...newKeywords],
          });
        }
      },
      setGotd: (gotd: Gotd) => {
        const { keyword, modes, id, numKeywords } = gotd;
        const { lives } = modes;
        set({
          gotdId: id,
          keywords: [keyword ?? ""],
          lives,
          livesLeft: lives,
          numKeywords,
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
          const res = await getIt("keywords");
          const { gotd } = await res.json();
          const currentGotdId = get().gotdId;

          if (!currentGotdId || currentGotdId !== gotd.id) {
            get().resetPlay();
            get().setGotd(gotd);
          }
        } catch (error) {
          console.error("Failed to set gotd (keywords):", error);
        }
      },
      resetPlay: () => {
        set({ ...initialState });
      },
    }),
    { name: "zkeywords" }
  )
);

zKeywords.getState().fetchGotd();

export default zKeywords;
