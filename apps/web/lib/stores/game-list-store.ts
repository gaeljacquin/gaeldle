import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Icon, IconLayoutGrid, IconList } from '@tabler/icons-react';
import { type NumericString } from '@workspace/shared';

export type SelectOption<T> = { value: T; label: string };

export type SortField = 'name' | 'firstReleaseDate' | 'igdbId' | 'createdAt';
export type SortDir = 'asc' | 'desc';
export type SortOption = `${SortField}-${SortDir}`;
export type ViewOption = 'grid' | 'list';

export interface GameListStore {
  sortOption: SortOption;
  setSortOption: (sortOption: SortOption) => void;
  pageSize: NumericString;
  setPageSize: (pageSize: NumericString) => void;
  view: ViewOption;
  setView: (view: ViewOption) => void;
}

export type DashboardStore = GameListStore;

export const sortOptions: SelectOption<SortOption>[] = [
  { value: 'name-asc', label: 'Title A → Z' },
  { value: 'name-desc', label: 'Title Z → A' },
  { value: 'firstReleaseDate-asc', label: 'Release Date ↑' },
  { value: 'firstReleaseDate-desc', label: 'Release Date ↓' },
  { value: 'igdbId-asc', label: 'IGDB ID ↑' },
  { value: 'igdbId-desc', label: 'IGDB ID ↓' },
  { value: 'createdAt-asc', label: 'Added ↑' },
  { value: 'createdAt-desc', label: 'Added ↓' },
];

export const pageSizes: NumericString[] = ['10', '25', '50', '100'];

export const viewOptions: (SelectOption<ViewOption> & { icon: Icon })[] = [
  { value: 'grid', label: 'Grid view', icon: IconLayoutGrid },
  { value: 'list', label: 'List view', icon: IconList },
];

export function createGameListStore(storageKey: string) {
  return create<GameListStore>()(
    persist(
      (set) => ({
        sortOption: 'name-asc',
        setSortOption: (newSortOption) => set({ sortOption: newSortOption }),
        pageSize: '10',
        setPageSize: (newPageSize) => set({ pageSize: newPageSize }),
        view: 'grid',
        setView: (newView) => set({ view: newView }),
      }),
      {
        name: storageKey,
      },
    ),
  );
}

export const useDashboardStore = createGameListStore('dashboard-settings');
export const useAmazonLibraryStore = createGameListStore(
  'amazon-library-settings',
);
export const useLibraryGogStore = createGameListStore('library-gog-settings');
export const useLibraryXboxStore = createGameListStore('library-xbox-settings');
export const useLibraryNintendoStore = createGameListStore(
  'library-nintendo-settings',
);
export const useSteamLibraryStore = createGameListStore(
  'steam-library-settings',
);
export const useEpicLibraryStore = createGameListStore('epic-library-settings');
export const useWishlistSteamStore = createGameListStore(
  'wishlist-steam-settings',
);
export const useWishlistEpicStore = createGameListStore(
  'wishlist-epic-settings',
);
export const useWishlistNintendoStore = createGameListStore(
  'wishlist-nintendo-settings',
);
export const useWishlistHumbleBundleStore = createGameListStore(
  'wishlist-humble-bundle-settings',
);
export const useWishlistXboxStore = createGameListStore(
  'wishlist-xbox-settings',
);
