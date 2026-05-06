'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBulkJobStatus } from '@/lib/services/game.service';

export type BulkJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'idle';

export interface BulkJobFailure {
  igdbId: number;
  gameName: string;
  error: string;
}

export interface BulkJobState {
  status: BulkJobStatus;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  failures: BulkJobFailure[];
  latestGame: string | null;
  processedGames: string[];
  isConnected: boolean;
}

const IDLE_STATE: BulkJobState = {
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
  data: { succeeded: number; failed: number; failures: BulkJobFailure[] };
};

type ErrorEvent = {
  type: 'error';
  data: { message: string };
};

type BulkJobEvent = ProgressEvent | CompletedEvent | ErrorEvent;

interface UseBulkImageJobOptions {
  jobId: string | null;
  enabled?: boolean;
  accessToken?: string | null;
}

export function useBulkImageJob({
  jobId,
  enabled = true,
  accessToken,
}: UseBulkImageJobOptions): BulkJobState {
  const [state, setState] = useState<BulkJobState>(IDLE_STATE);
  const [sseConnected, setSseConnected] = useState(false);
  const [sseFailed, setSseFailed] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isTerminalRef = useRef(false);

  const isTerminal = state.status === 'completed' || state.status === 'failed';

  // Polling fallback: used when SSE fails or job is already terminal
  const { data: polledJob } = useQuery({
    queryKey: ['bulk-job-status', jobId],
    queryFn: () => getBulkJobStatus(jobId!),
    enabled: !!jobId && enabled && (sseFailed || isTerminal),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
  });

  // Derive polled state without an effect — avoids synchronous setState inside useEffect
  const polledState = useMemo<BulkJobState | null>(() => {
    if (!polledJob || sseConnected) return null;
    return {
      status: polledJob.status as BulkJobStatus,
      total: polledJob.total,
      processed: polledJob.processed,
      succeeded: polledJob.succeeded,
      failed: polledJob.failed,
      failures: polledJob.failures as BulkJobFailure[],
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
    if (!jobId || !enabled || !accessToken || isTerminalRef.current) return;

    const apiBase = process.env.serverUrl || 'http://localhost:8080';
    const url = `${apiBase}/api/games/bulk-generate-images/${jobId}/stream?token=${encodeURIComponent(accessToken)}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setSseConnected(true);
      setSseFailed(false);
    };

    es.onmessage = (ev: MessageEvent<string>) => {
      let event: BulkJobEvent;
      try {
        event = JSON.parse(ev.data) as BulkJobEvent;
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
  }, [jobId, enabled, accessToken, closeSSE]);

  if (!jobId || !enabled) return IDLE_STATE;

  const activeState = polledState ?? state;
  return { ...activeState, isConnected: sseConnected };
}
