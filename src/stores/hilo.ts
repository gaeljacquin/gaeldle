import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Game } from '@/services/games';
import { GuessHilo, ZHilo } from '@/types/zhilo';

export const initialState = {
  streak: 0,
  timeline: [],
  guesses: [],
  bestStreak: 0,
};

const zHilo = create(
  persist(
    devtools<ZHilo>((set, get) => ({
      ...initialState,
      getStreak: () => get().streak,
      getBestStreak: () => get().bestStreak,
      getGuesses: () => get().guesses,
      getTimeline: () => get().timeline,
      setStreak: (won: boolean) => {
        const streak = won ? get().streak + 1 : 0;
        set({ streak });
      },
      setBestStreak: () => {
        const bestStreak = Math.max(get().bestStreak, get().streak);
        set({ bestStreak });
      },
      updateGuesses: (guesses: GuessHilo[]) => {
        set({ guesses });
      },
      updateTimeline: (timeline: Partial<Game>[]) => {
        set({ timeline });
      },
    })),
    {
      name: 'zhilo',
      partialize: (state) => {
        const { bestStreak, ...rest } = state;
        void rest;

        return { bestStreak };
      },
    }
  )
);

export default zHilo;
