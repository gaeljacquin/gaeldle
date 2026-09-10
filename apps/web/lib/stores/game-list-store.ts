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

export const GAME_LIST_STORAGE_KEYS = {
  dashboard: 'dashboard-settings',
  'library-amazon': 'amazon-library-settings',
  'library-gog': 'library-gog-settings',
  'library-xbox': 'library-xbox-settings',
  'library-nintendo': 'library-nintendo-settings',
  'library-steam': 'steam-library-settings',
  'library-epic': 'epic-library-settings',
  'wishlist-steam': 'wishlist-steam-settings',
  'wishlist-epic': 'wishlist-epic-settings',
  'wishlist-nintendo': 'wishlist-nintendo-settings',
  'wishlist-humble-bundle': 'wishlist-humble-bundle-settings',
  'wishlist-xbox': 'wishlist-xbox-settings',
} as const;

export type GameListStoreKey = keyof typeof GAME_LIST_STORAGE_KEYS;

const storeRegistry = new Map<
  GameListStoreKey,
  ReturnType<typeof createGameListStore>
>();

export function getGameListStore(key: GameListStoreKey) {
  let store = storeRegistry.get(key);
  if (!store) {
    store = createGameListStore(GAME_LIST_STORAGE_KEYS[key]);
    storeRegistry.set(key, store);
  }
  return store;
}

export const useDashboardStore = getGameListStore('dashboard');
export const useAmazonLibraryStore = getGameListStore('library-amazon');
export const useLibraryGogStore = getGameListStore('library-gog');
export const useLibraryXboxStore = getGameListStore('library-xbox');
export const useLibraryNintendoStore = getGameListStore('library-nintendo');
export const useSteamLibraryStore = getGameListStore('library-steam');
export const useEpicLibraryStore = getGameListStore('library-epic');
export const useWishlistSteamStore = getGameListStore('wishlist-steam');
export const useWishlistEpicStore = getGameListStore('wishlist-epic');
export const useWishlistNintendoStore = getGameListStore('wishlist-nintendo');
export const useWishlistHumbleBundleStore = getGameListStore(
  'wishlist-humble-bundle',
);
export const useWishlistXboxStore = getGameListStore('wishlist-xbox');
