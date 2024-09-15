import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Game, Games, GuessWithSpecs } from "@/types/games";
import { Gotd } from "@/types/gotd";
import { Mode } from "@/types/modes";

export interface specificationsStore {
  gotdId: number;
  imageUrl: string;
  name: string;
  lives: number;
  livesLeft: number;
  guesses: GuessWithSpecs[];
  played: boolean;
  won: boolean;
  date: Date;
  summary: Partial<GuessWithSpecs>;
  mode: Mode;
  getGotdId: () => number;
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
  resetPlay: () => void;
}

export const defaultSpecifications = {
  gotdId: 0,
  imageUrl: "/placeholder.jpg",
  name: "",
  lives: 0,
  livesLeft: 0,
  guesses: [],
  played: false,
  won: false,
  summary: {
    franchises: null,
    game_engines: null,
    game_modes: null,
    genres: null,
    platforms: null,
    player_perspectives: null,
    release_dates: null,
    themes: null,
  },
  date: "",
  mode: null,
};

const useSpecificationsStore = create(
  persist(
    (set: (arg0: unknown) => void, get: () => unknown) => ({
      ...defaultSpecifications,
      getGotdId: () => (get() as { gotdId: number }).gotdId,
      updateLivesLeft: () => {
        const livesLeft = (get() as { livesLeft: number }).livesLeft;
        set({ livesLeft: livesLeft - 1 });
      },
      updateGuesses: (guess: GuessWithSpecs) => {
        const guesses = (get() as { guesses: GuessWithSpecs[] }).guesses;
        set({ guesses: [guess, ...guesses] });
      },
      getLivesLeft: () => (get() as { livesLeft: number }).livesLeft,
      getGuesses: () => (get() as { guesses: GuessWithSpecs[] }).guesses,
      markAsPlayed: () => {
        set({ played: true });
      },
      getPlayed: () => (get() as { played: boolean }).played,
      markAsWon: () => {
        set({ won: true });
      },
      setGotd: (gotd: Gotd) => {
        const { imageUrl, modes, id } = gotd;
        const { label, lives } = modes;
        set({
          gotdId: id,
          imageUrl,
          label,
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
      getName: () => (get() as { name: string }).name,
      setSummary: (summary: Partial<GuessWithSpecs>) => {
        set({ summary });
      },
      getSummary: () => (get() as { summary: Partial<GuessWithSpecs> }).summary,
      resetPlay: () => {
        set({
          played: false,
          won: false,
          guesses: [],
          summary: defaultSpecifications.summary,
        });
      },
    }),
    { name: "specifications-gaeldle-store" }
  )
);

export default useSpecificationsStore;
