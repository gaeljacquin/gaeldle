import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ZHome } from '@/types/zhome';

export const initialState = {
  menuTypes: ['list', 'carousel'],
  menuType: 'list',
};

const zHome = create(
  persist(
    devtools<ZHome>((set, get) => ({
      ...initialState,
      getMenuType: () => get().menuType,
      setMenuType: (menuType: string) => {
        set({ menuType });
      },
    })),
    {
      name: 'zhome',
      partialize: (state) => {
        const { menuType, ...rest } = state;
        void rest;

        return { menuType };
      },
    }
  )
);

export default zHome;
