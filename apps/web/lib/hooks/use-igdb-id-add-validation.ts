'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { validateIgdbIdAdd } from '@/lib/services/game.service';
import { useState, useEffect, useCallback, useRef } from 'react';

export interface IgdbIdAddValidationState {
  isLoading: boolean;
  isReady: boolean;
  existsOnIgdb: boolean | null;
  alreadyInDb: boolean | null;
  gameName: string | null;
  canAdd: boolean;
  refetch: () => void;
  stop: () => void;
}

const DEFAULT_STATE: Omit<IgdbIdAddValidationState, 'refetch' | 'stop'> = {
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
  const queryClient = useQueryClient();
  const [forcedInt, setForcedInt] = useState<number | null>(null);
  const liveInt = parsePositiveInt(igdbId);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset forcedInt when live input changes so we clear previous validation
  useEffect(() => {
    setForcedInt(null);
  }, [igdbId]);

  const queryKey = ['igdb-add-validate', forcedInt];

  const { data, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: ({ signal }) => validateIgdbIdAdd(forcedInt!, signal),
    enabled: forcedInt !== null,
    staleTime: 30_000,
  });

  const handleStop = useCallback(() => {
    void queryClient.cancelQueries({ queryKey });
    setForcedInt(null);
  }, [queryClient, queryKey]);

  const handleRefetch = useCallback(() => {
    if (liveInt !== null) {
      setForcedInt(liveInt);
      if (liveInt === forcedInt) {
        void refetch();
      }
    }
  }, [liveInt, forcedInt, refetch]);

  if (isFetching) {
    return {
      ...DEFAULT_STATE,
      isLoading: true,
      refetch: handleRefetch,
      stop: handleStop,
    };
  }

  if (!data || forcedInt === null) {
    return { ...DEFAULT_STATE, refetch: handleRefetch, stop: handleStop };
  }

  return {
    isLoading: false,
    isReady: true,
    existsOnIgdb: data.existsOnIgdb,
    alreadyInDb: data.alreadyInDb,
    gameName: data.gameName,
    canAdd: data.canAdd,
    refetch: handleRefetch,
    stop: handleStop,
  };
}
