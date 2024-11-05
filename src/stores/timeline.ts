import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ZTimeline } from '@/types/ztimeline';

const initialState = {
  streak: 0,
  bestStreak: 0,
  dragSwitch: true,
};

const zTimeline = create(
  persist(
    devtools<ZTimeline>((set, get) => ({
      ...initialState,
      getStreak: () => get().streak,
      getBestStreak: () => get().bestStreak,
      setStreak: (won: boolean) => {
        const streak = won ? get().streak + 1 : 0;
        set({ streak });
      },
      setBestStreak: () => {
        const bestStreak = Math.max(get().bestStreak, get().streak);
        set({ bestStreak });
      },
      setDragSwitch: () => {
        const dragSwitch = get().dragSwitch;
        set({ dragSwitch: !dragSwitch });
      },
    })),
    {
      name: 'ztimeline',
      partialize: (state) => {
        const { streak, bestStreak, dragSwitch, ...rest } = state;
        void rest;

        return { streak, bestStreak, dragSwitch };
      },
    }
  )
);

export default zTimeline;
