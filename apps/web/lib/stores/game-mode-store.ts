import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GAME_MODE_SKELETON_COUNT } from '@workspace/shared';

interface GameModeStore {
  activeGameModeCount: number;
  setActiveGameModeCount: (count: number) => void;
}

export const useGameModeStore = create<GameModeStore>()(
  persist(
    (set) => ({
      activeGameModeCount: GAME_MODE_SKELETON_COUNT,
      setActiveGameModeCount: (count) =>
        set({ activeGameModeCount: Math.max(0, count) }),
    }),
    { name: 'game-mode-settings' },
  ),
);
