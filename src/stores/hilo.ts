import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ZHilo } from '@/types/zhilo';

export const initialState = {
  streak: 0,
  bestStreak: 0,
};

const zHilo = create(
  persist(
    devtools<ZHilo>((set, get) => ({
      ...initialState,
      setStreak: (won: boolean) => {
        const streak = won ? get().streak + 1 : 0;
        set({ streak });
      },
      setBestStreak: () => {
        const bestStreak = Math.max(get().bestStreak, get().streak);
        set({ bestStreak });
      },
      getStreak: () => get().streak,
      getBestStreak: () => get().bestStreak,
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
