'use client';

import { useQuery } from '@tanstack/react-query';
import { validateReplaceGame } from '@/lib/services/game.service';
import { useDebounce } from '@/lib/hooks/use-debounce';

export interface ReplaceGameValidationState {
  isLoading: boolean;
  isReady: boolean;
  sameIds: boolean;
  currentExistsInDb: boolean | null;
  currentGameName: string | null;
  replacementExistsOnIgdb: boolean | null;
  replacementAlreadyInDb: boolean | null;
  replacementGameName: string | null;
  canApply: boolean;
}

const DEFAULT_STATE: ReplaceGameValidationState = {
  isLoading: false,
  isReady: false,
  sameIds: false,
  currentExistsInDb: null,
  currentGameName: null,
  replacementExistsOnIgdb: null,
  replacementAlreadyInDb: null,
  replacementGameName: null,
  canApply: false,
};

function parsePositiveInt(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number.parseInt(trimmed, 10);
  if (Number.isNaN(n) || n <= 0 || String(n) !== trimmed) return null;
  return n;
}

export function useReplaceGameValidation(
  current: string,
  replacement: string,
): ReplaceGameValidationState {
  const debouncedCurrent = useDebounce(current, 600);
  const debouncedReplacement = useDebounce(replacement, 600);

  const currentInt = parsePositiveInt(current);
  const replacementInt = parsePositiveInt(replacement);
  const debouncedCurrentInt = parsePositiveInt(debouncedCurrent);
  const debouncedReplacementInt = parsePositiveInt(debouncedReplacement);

  const bothValid = debouncedCurrentInt !== null && debouncedReplacementInt !== null;
  const sameIds = bothValid && debouncedCurrentInt === debouncedReplacementInt;

  // True while the user is still typing (live value differs from debounced value)
  const isTyping =
    currentInt !== debouncedCurrentInt || replacementInt !== debouncedReplacementInt;

  const { data, isFetching } = useQuery({
    queryKey: ['replace-game-validate', debouncedCurrentInt, debouncedReplacementInt],
    queryFn: () => validateReplaceGame(debouncedCurrentInt!, debouncedReplacementInt!),
    enabled: bothValid,
    staleTime: 30_000,
  });

  if (!bothValid && !isTyping) {
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
    sameIds,
    currentExistsInDb: data.currentExistsInDb,
    currentGameName: data.currentGameName,
    replacementExistsOnIgdb: data.currentExistsInDb
      ? data.replacementExistsOnIgdb
      : null,
    replacementAlreadyInDb: data.currentExistsInDb
      ? data.replacementAlreadyInDb
      : null,
    replacementGameName: data.replacementGameName,
    canApply: data.canApply,
  };
}
