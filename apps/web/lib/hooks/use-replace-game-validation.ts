'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { validateReplaceGame } from '@/lib/services/game.service';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useState, useCallback, useMemo } from 'react';

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
  refetch: () => void;
  stop: () => void;
}

const DEFAULT_STATE: Omit<ReplaceGameValidationState, 'refetch' | 'stop'> = {
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

export function useReplaceGameValidation(
  current: string,
  replacement: string,
): ReplaceGameValidationState {
  const queryClient = useQueryClient();
  const [forcedReplacementInt, setForcedReplacementInt] = useState<
    number | null
  >(null);

  const debouncedCurrent = useDebounce(current, 600);
  const currentInt = Number.parseInt(current, 10);
  const debouncedCurrentInt = Number.parseInt(debouncedCurrent, 10);
  const replacementInt = Number.parseInt(replacement, 10);

  const bothValid =
    debouncedCurrentInt !== null && forcedReplacementInt !== null;
  const sameIds = bothValid && debouncedCurrentInt === forcedReplacementInt;
  const isTypingCurrent = currentInt !== debouncedCurrentInt;

  const queryKey = useMemo(
    () => ['replace-game-validate', debouncedCurrentInt, forcedReplacementInt],
    [debouncedCurrentInt, forcedReplacementInt],
  );

  const { data, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      validateReplaceGame(debouncedCurrentInt!, forcedReplacementInt!, signal),
    enabled: bothValid,
    staleTime: 30_000,
  });

  const handleStop = useCallback(() => {
    void queryClient.cancelQueries({ queryKey });

    setForcedReplacementInt(null);
  }, [queryClient, queryKey]);

  const handleRefetch = useCallback(() => {
    if (debouncedCurrentInt !== null && replacementInt !== null) {
      setForcedReplacementInt(replacementInt);

      if (replacementInt === forcedReplacementInt) {
        void refetch();
      }
    }
  }, [debouncedCurrentInt, replacementInt, forcedReplacementInt, refetch]);

  if (!bothValid && !isTypingCurrent && !isFetching) {
    return { ...DEFAULT_STATE, refetch: handleRefetch, stop: handleStop };
  }

  if (isTypingCurrent || isFetching) {
    return {
      ...DEFAULT_STATE,
      isLoading: true,
      refetch: handleRefetch,
      stop: handleStop,
    };
  }

  if (!data || forcedReplacementInt === null) {
    return { ...DEFAULT_STATE, refetch: handleRefetch, stop: handleStop };
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
    refetch: handleRefetch,
    stop: handleStop,
  };
}
