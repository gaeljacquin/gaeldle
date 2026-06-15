'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getImageGenStatus } from '@/lib/services/game.service';
import { ImageGenStatusPlus } from '@workspace/api-contract';

export interface ImageGenFailure {
  igdbId: number;
  gameName: string;
  error: string;
}

export interface ImageGenState {
  status: ImageGenStatusPlus;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  failures: ImageGenFailure[];
  latestGame: string | null;
  processedGames: string[];
  isConnected: boolean;
}

const idleState: ImageGenState = {
  status: 'idle',
  total: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  failures: [],
  latestGame: null,
  processedGames: [],
  isConnected: false,
};

type ProgressEvent = {
  type: 'progress';
  data: {
    processed: number;
    succeeded: number;
    failed: number;
    total: number;
    latestGame: string;
  };
};

type CompletedEvent = {
  type: 'completed';
  data: { succeeded: number; failed: number; failures: ImageGenFailure[] };
};

type ErrorEvent = {
  type: 'error';
  data: { message: string };
};

type ImageGenEvent = ProgressEvent | CompletedEvent | ErrorEvent;

interface UseImageGenOptions {
  imageGenId: string | null;
  enabled?: boolean;
  accessToken?: string | null;
}

export function useImageGen({
  imageGenId,
  enabled = true,
  accessToken,
}: UseImageGenOptions): ImageGenState {
  const [state, setState] = useState<ImageGenState>(idleState);
  const [sseConnected, setSseConnected] = useState(false);
  const [sseFailed, setSseFailed] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isTerminalRef = useRef(false);
  const isTerminal = state.status === 'completed' || state.status === 'failed';

  // Polling fallback: used when SSE fails or generation is already terminal
  const { data: polledJob } = useQuery({
    queryKey: ['image-gen-status', imageGenId],
    queryFn: () => getImageGenStatus(imageGenId!),
    enabled: !!imageGenId && enabled && (sseFailed || isTerminal),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
  });

  // Derive polled state without an effect — avoids synchronous setState inside useEffect
  const polledState = useMemo<ImageGenState | null>(() => {
    if (!polledJob || sseConnected) {
      return null;
    }

    return {
      status: polledJob.status as ImageGenStatusPlus,
      total: polledJob.total,
      processed: polledJob.processed,
      succeeded: polledJob.succeeded,
      failed: polledJob.failed,
      failures: polledJob.failures as ImageGenFailure[],
      latestGame: null,
      processedGames: [],
      isConnected: false,
    };
  }, [polledJob, sseConnected]);

  const closeSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setSseConnected(false);
  }, []);

  // SSE connection
  useEffect(() => {
    if (!imageGenId || !enabled || !accessToken || isTerminalRef.current) {
      return;
    }

    const url = `${process.env.apiUrl}/api/image-gen/generate-images/${imageGenId}/stream?token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(url);

    eventSourceRef.current = es;

    es.onopen = () => {
      setSseConnected(true);
      setSseFailed(false);
    };

    es.onmessage = (ev: MessageEvent<string>) => {
      let event: ImageGenEvent;
      try {
        event = JSON.parse(ev.data) as ImageGenEvent;
      } catch {
        return;
      }

      if (event.type === 'progress') {
        setState((prev) => ({
          ...prev,
          status: 'running',
          total: event.data.total,
          processed: event.data.processed,
          succeeded: event.data.succeeded,
          failed: event.data.failed,
          latestGame: event.data.latestGame,
          processedGames: [...prev.processedGames, event.data.latestGame],
          isConnected: true,
        }));
      } else if (event.type === 'completed') {
        isTerminalRef.current = true;

        setState((prev) => ({
          ...prev,
          status:
            prev.failed === prev.total && prev.total > 0
              ? 'failed'
              : 'completed',
          succeeded: event.data.succeeded,
          failed: event.data.failed,
          failures: event.data.failures,
          latestGame: null,
          isConnected: false,
        }));

        closeSSE();
      } else if (event.type === 'error') {
        isTerminalRef.current = true;

        setState((prev) => ({ ...prev, status: 'failed', isConnected: false }));

        closeSSE();
      }
    };

    es.onerror = () => {
      closeSSE();

      setSseFailed(true);
    };

    return closeSSE;
  }, [imageGenId, enabled, accessToken, closeSSE]);

  if (!imageGenId || !enabled) {
    return idleState;
  }

  const activeState = polledState ?? state;

  return { ...activeState, isConnected: sseConnected };
}
