'use client';

import { useQuery } from '@tanstack/react-query';
import { validateIgdbIdAdd } from '@/lib/services/game.service';
import { useDebounce } from '@/lib/hooks/use-debounce';

export interface IgdbIdAddValidationState {
  isLoading: boolean;
  isReady: boolean;
  existsOnIgdb: boolean | null;
  alreadyInDb: boolean | null;
  gameName: string | null;
  canAdd: boolean;
}

const DEFAULT_STATE: IgdbIdAddValidationState = {
  isLoading: false,
  isReady: false,
  existsOnIgdb: null,
  alreadyInDb: null,
  gameName: null,
  canAdd: false,
};

function parsePositiveInt(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number.parseInt(trimmed, 10);
  if (Number.isNaN(n) || n <= 0 || String(n) !== trimmed) return null;
  return n;
}

export function useIgdbIdAddValidation(
  igdbId: string,
): IgdbIdAddValidationState {
  const debouncedIgdbId = useDebounce(igdbId, 600);

  const liveInt = parsePositiveInt(igdbId);
  const debouncedInt = parsePositiveInt(debouncedIgdbId);

  const isValid = debouncedInt !== null;

  // True while the user is still typing (live value differs from debounced value)
  const isTyping = liveInt !== debouncedInt;

  const { data, isFetching } = useQuery({
    queryKey: ['igdb-add-validate', debouncedInt],
    queryFn: () => validateIgdbIdAdd(debouncedInt!),
    enabled: isValid,
    staleTime: 30_000,
  });

  if (!isValid && !isTyping) {
    return DEFAULT_STATE;
  }

  // While typing or waiting for debounce, show spinner and suppress stale result
  if (isTyping || isFetching) {
    return {
      ...DEFAULT_STATE,
      isLoading: true,
    };
  }

  if (!data) {
    return DEFAULT_STATE;
  }

  return {
    isLoading: false,
    isReady: true,
    existsOnIgdb: data.existsOnIgdb,
    alreadyInDb: data.alreadyInDb,
    gameName: data.gameName,
    canAdd: data.canAdd,
  };
}
