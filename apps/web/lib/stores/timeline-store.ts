import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimelineStore {
  swapMode: boolean;
  setSwapMode: (enabled: boolean) => void;
}

export const useTimelineStore = create<TimelineStore>()(
  persist(
    (set) => ({
      swapMode: false,
      setSwapMode: (enabled) => set({ swapMode: enabled }),
    }),
    {
      name: 'timeline-settings',
    }
  )
);
