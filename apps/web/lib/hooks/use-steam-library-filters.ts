'use client';

import {
  useGameListFilters,
  type UseGameListFiltersOptions,
  type UseGameListFiltersReturn,
} from '@/lib/hooks/use-game-list-filters';
import type { SteamFilter } from '@/lib/services/game.service';

export type UseSteamLibraryFiltersOptions = Omit<
  UseGameListFiltersOptions<SteamFilter>,
  'filterOptions'
>;

export function useSteamLibraryFilters(options: UseSteamLibraryFiltersOptions) {
  return useGameListFilters<SteamFilter>({
    ...options,
    filterOptions: {
      default: 'all',
      validValues: ['all', 'owned', 'demos'],
    },
  });
}

export type UseSteamLibraryFiltersReturn =
  UseGameListFiltersReturn<SteamFilter>;
