'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { discoverScan, discoverApply } from '@/lib/services/discover.service';
import { DISCOVER_GAMES_DEFAULT, DISCOVER_GAMES_MAX } from '@gaeldle/constants';
import type { DiscoverCandidate, DiscoverApplyResult } from '@gaeldle/api-contract';

export function useDiscoverGames() {
  const [countInput, setCountInput] = useState(DISCOVER_GAMES_DEFAULT);
  const [candidates, setCandidates] = useState<DiscoverCandidate[]>([]);
  const [scanEventId, setScanEventId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
  const [applyResults, setApplyResults] = useState<DiscoverApplyResult[] | null>(null);

  const scanMutation = useMutation({
    mutationFn: (count: number) => discoverScan(count),
    onMutate: () => {
      toast.loading('Scanning IGDB for candidates…', { id: 'discover-scan' });
    },
    onSuccess: (data) => {
      setCandidates(data.candidates as DiscoverCandidate[]);
      setScanEventId(data.scanEventId);
      setSelectedIds(new Set());
      setAppliedIds(new Set());
      setApplyResults(null);
      toast.success(
        `Found ${data.totalReturned} candidates (${data.alreadyAddedCount} already in library)`,
        { id: 'discover-scan' },
      );
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Scan failed',
        { id: 'discover-scan' },
      );
    },
  });

  const applyMutation = useMutation({
    mutationFn: ({
      scanEventId: evtId,
      selectedIgdbIds,
    }: {
      scanEventId: number;
      selectedIgdbIds: number[];
    }) => discoverApply(evtId, selectedIgdbIds),
    onMutate: () => {
      toast.loading('Adding selected games…', { id: 'discover-apply' });
    },
    onSuccess: (data) => {
      const added = data.results.filter((r) => r.status !== 'error').length;
      const errors = data.results.filter((r) => r.status === 'error').length;
      setApplyResults(data.results as DiscoverApplyResult[]);
      const newApplied = new Set(appliedIds);
      for (const r of data.results) {
        if (r.status !== 'error') {
          newApplied.add(r.igdbId);
        }
      }
      setAppliedIds(newApplied);
      setSelectedIds(new Set());
      if (errors > 0) {
        toast.warning(`${added} game(s) added, ${errors} error(s)`, {
          id: 'discover-apply',
        });
      } else {
        toast.success(`${added} game(s) added successfully`, {
          id: 'discover-apply',
        });
      }
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Apply failed',
        { id: 'discover-apply' },
      );
    },
  });

  const toggleSelect = useCallback((igdbId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(igdbId)) {
        next.delete(igdbId);
      } else {
        next.add(igdbId);
      }
      return next;
    });
  }, []);

  const selectAllNew = useCallback(
    (currentCandidates: DiscoverCandidate[]) => {
      const newIds = currentCandidates
        .filter((c) => !c.isAlreadyAdded && !appliedIds.has(c.igdbId))
        .map((c) => c.igdbId);
      setSelectedIds(new Set(newIds));
    },
    [appliedIds],
  );

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleScan = useCallback(() => {
    const clamped = Math.min(Math.max(1, countInput), DISCOVER_GAMES_MAX);
    scanMutation.mutate(clamped);
  }, [countInput, scanMutation]);

  const handleApply = useCallback(() => {
    if (!scanEventId || selectedIds.size === 0) return;
    applyMutation.mutate({
      scanEventId,
      selectedIgdbIds: Array.from(selectedIds),
    });
  }, [scanEventId, selectedIds, applyMutation]);

  const canApply =
    selectedIds.size > 0 &&
    scanEventId !== null &&
    !applyMutation.isPending;

  return {
    // scan
    scanMutation,
    candidates,
    scanEventId,
    handleScan,
    // selection
    selectedIds,
    appliedIds,
    toggleSelect,
    selectAllNew,
    deselectAll,
    // apply
    applyMutation,
    applyResults,
    handleApply,
    // derived
    canApply,
    // count input
    countInput,
    setCountInput,
  };
}
