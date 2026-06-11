'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { validateIgdbIdAdd } from '@/lib/services/game.service';
import { useState, useCallback, useMemo } from 'react';

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

const defaultState: Omit<IgdbIdAddValidationState, 'refetch' | 'stop'> = {
  isLoading: false,
  isReady: false,
  existsOnIgdb: null,
  alreadyInDb: null,
  gameName: null,
  canAdd: false,
};

export function useIgdbIdAddValidation(
  igdbId: string,
): IgdbIdAddValidationState {
  const queryClient = useQueryClient();
  const [forcedInt, setForcedInt] = useState<number | null>(null);
  const liveInt = Number.parseInt(igdbId, 10);
  const queryKey = useMemo(() => ['igdb-add-validate', forcedInt], [forcedInt]);

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
      ...defaultState,
      isLoading: true,
      refetch: handleRefetch,
      stop: handleStop,
    };
  }

  if (!data || forcedInt === null) {
    return { ...defaultState, refetch: handleRefetch, stop: handleStop };
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
