'use client';

import { useQuery } from '@tanstack/react-query';
import { searchGames } from '@/lib/services/game.service';
import { useDebounce } from '@/lib/hooks/use-debounce';
import type { Game, GameModeSlug } from '@workspace/api-contract';
import { GAME_SEARCH_MIN_CHARS } from '@workspace/constants';

interface GameSearchOptions {
  mode?: GameModeSlug;
  limit?: number;
}

interface GameSearchResult {
  results: Game[];
  isLoading: boolean;
  isIdle: boolean;
  debouncedQuery: string;
}

export function useGameSearch(
  query: string,
  options: GameSearchOptions = {},
): GameSearchResult {
  const { mode, limit } = options;
  const debouncedQuery = useDebounce(query, 300);

  const isIdle = debouncedQuery.length < GAME_SEARCH_MIN_CHARS;

  const { data, isFetching } = useQuery({
    queryKey: ['game-search', debouncedQuery, mode],
    queryFn: () => searchGames(debouncedQuery, limit, mode),
    enabled: !isIdle,
    staleTime: 30_000,
  });

  // Show loading spinner while the live query differs from the debounced query
  // OR while the query itself is fetching
  const isLoading = query !== debouncedQuery || isFetching;

  return {
    results: data ?? [],
    isLoading,
    isIdle,
    debouncedQuery,
  };
}
