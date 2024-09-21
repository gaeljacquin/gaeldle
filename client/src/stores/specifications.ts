import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GuessWithSpecs, Spec } from "@/types/games";
import { Gotd } from "@/types/gotd";
import { Mode } from "@/types/modes";
import getIt from "~/src/lib/get-it";

export interface SpecificationsSlice {
  gotdId: number;
  imageUrl: string;
  name: string;
  lives: number;
  livesLeft: number;
  guesses: GuessWithSpecs[];
  played: boolean;
  won: boolean;
  summary: Partial<GuessWithSpecs>;
  mode: Mode;
  updateLivesLeft: () => void;
  updateGuesses: (arg0: GuessWithSpecs | null) => void;
  getLivesLeft: () => number;
  getGuesses: () => GuessWithSpecs[];
  markAsPlayed: () => void;
  markAsWon: () => void;
  getPlayed: () => boolean;
  setGotd: (arg0: Gotd) => void;
  setImageUrl: (arg0: string) => void;
  getName: () => string;
  setName: (arg0: string) => void;
  getSummary: () => Partial<GuessWithSpecs>;
  setSummary: (arg0: Partial<GuessWithSpecs>) => void;
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
  summary: {
    franchises: null as unknown as Spec,
    game_engines: null as unknown as Spec,
    game_modes: null as unknown as Spec,
    genres: null as unknown as Spec,
    platforms: null as unknown as Spec,
    player_perspectives: null as unknown as Spec,
    release_dates: null as unknown as Spec,
    themes: null as unknown as Spec,
  },
  mode: null as unknown as Mode,
};

const zSpecs = create(
  persist<SpecificationsSlice>(
    (set, get) => ({
      ...initialState,
      updateLivesLeft: () => {
        const livesLeft = get().livesLeft;
        set({ livesLeft: livesLeft - 1 });
      },
      updateGuesses: (guess: GuessWithSpecs | null) => {
        const guesses = (get() as { guesses: GuessWithSpecs[] }).guesses;
        if (guess) {
          set({ guesses: [guess, ...guesses] });
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
      setGotd: (gotd: Gotd) => {
        const { imageUrl, modes, id } = gotd;
        const { lives } = modes;
        set({
          gotdId: id,
          imageUrl,
          lives,
          livesLeft: lives,
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
      setSummary: (summary: Partial<GuessWithSpecs>) => {
        set({ summary });
      },
      getSummary: () => (get() as { summary: Partial<GuessWithSpecs> }).summary,
      fetchGotd: async () => {
        try {
          const res = await getIt("specifications");
          const { gotd, newGotd } = await res.json();

          if (newGotd) {
            get().resetPlay();
          }

          if (gotd && (newGotd || !get().gotdId)) {
            get().setGotd(gotd);
          }
        } catch (error) {
          console.error("Failed to set gotd (specifications):", error);
        }
      },
      resetPlay: () => {
        set({ ...initialState });
      },
    }),
    { name: "zspecs" }
  )
);

zSpecs.getState().fetchGotd();

export default zSpecs;
