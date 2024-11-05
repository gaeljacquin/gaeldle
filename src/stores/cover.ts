import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ZCover } from '@/types/zcover';

const initialState = {
  streak: 0,
  bestStreak: 0,
};

const zCover = create(
  persist(
    devtools<ZCover>((set, get) => ({
      ...initialState,
      getStreak: () => get().streak,
      setStreak: (won: boolean) => {
        const streak = won ? get().streak + 1 : 0;
        set({ streak });
      },
      setBestStreak: () => {
        const bestStreak = Math.max(get().bestStreak, get().streak);
        set({ bestStreak });
      },
      getBestStreak: () => get().bestStreak,
    })),
    {
      name: 'zcover',
    }
  )
);

export default zCover;
