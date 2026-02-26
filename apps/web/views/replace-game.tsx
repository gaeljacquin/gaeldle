'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useUser } from '@stackframe/stack';
import { replaceGameByIdgbId } from '@/lib/services/game.service';
import {
  useReplaceGameValidation,
  type ReplaceGameValidationState,
} from '@/lib/hooks/use-replace-game-validation';
import { IgdbIdPairRow } from '@/components/igdb-id-pair-row';
import type { IgdbIdPairRowData } from '@/components/igdb-id-pair-row';
import {
  ReplaceGameResultsTable,
  type ReplaceGameResult,
} from '@/components/replace-game-results-table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  IconArrowsExchange,
  IconPlus,
  IconPlayerPlay,
  IconLoader,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { REPLACE_GAME_MAX_ROWS } from '@gaeldle/constants';
import { DashboardPageHeader } from '@/components/dashboard-header';

function createEmptyRow(): IgdbIdPairRowData {
  return { id: crypto.randomUUID(), current: '', replacement: '' };
}

// Each row is wrapped in a component so each gets its own hook invocation
interface RowWithValidationProps {
  row: IgdbIdPairRowData;
  onCurrentChange: (id: string, value: string) => void;
  onReplacementChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  onValidationChange: (id: string, state: ReplaceGameValidationState) => void;
}

function RowWithValidation({
  row,
  onCurrentChange,
  onReplacementChange,
  onRemove,
  canRemove,
  onValidationChange,
}: Readonly<RowWithValidationProps>) {
  const validationState = useReplaceGameValidation(row.current, row.replacement);

  useEffect(() => {
    onValidationChange(row.id, validationState);
  }, [row.id, validationState, onValidationChange]);

  return (
    <IgdbIdPairRow
      row={row}
      validationState={validationState}
      onCurrentChange={onCurrentChange}
      onReplacementChange={onReplacementChange}
      onRemove={onRemove}
      canRemove={canRemove}
    />
  );
}

export default function ReplaceGameByIgdbId() {
  useUser({ or: 'redirect' });

  const [rows, setRows] = useState<IgdbIdPairRowData[]>([createEmptyRow()]);
  const [results, setResults] = useState<ReplaceGameResult[] | null>(null);
  const [validationMap, setValidationMap] = useState<
    Record<string, ReplaceGameValidationState>
  >({});

  const handleValidationChange = useCallback(
    (id: string, state: ReplaceGameValidationState) => {
      setValidationMap((prev) => {
        const current = prev[id];
        if (
          current?.canApply === state.canApply &&
          current?.isLoading === state.isLoading &&
          current?.isReady === state.isReady
        ) {
          return prev;
        }
        return { ...prev, [id]: state };
      });
    },
    [],
  );

  const allPairsValid =
    rows.length > 0 &&
    rows.every((row) => validationMap[row.id]?.canApply === true);

  const applyMutation = useMutation({
    mutationFn: () => {
      const pairs = rows.map((row) => ({
        current: Number.parseInt(row.current, 10),
        replacement: Number.parseInt(row.replacement, 10),
      }));
      return replaceGameByIdgbId(pairs);
    },
    onMutate: () => {
      toast.loading('Replacing games...', { id: 'replace-games' });
    },
    onSuccess: (data) => {
      toast.dismiss('replace-games');
      const updatedCount = data.results.filter(
        (r) => r.status === 'updated',
      ).length;
      const errorCount = data.results.filter(
        (r) => r.status === 'error',
      ).length;

      if (errorCount > 0) {
        toast.error(
          `Completed with ${errorCount} error${errorCount === 1 ? '' : 's'}. ${updatedCount} updated.`,
        );
      } else {
        toast.success(
          `Done! ${updatedCount} game${updatedCount === 1 ? '' : 's'} updated.`,
        );
      }

      setResults(data.results as ReplaceGameResult[]);
    },
    onError: (err: Error) => {
      toast.dismiss('replace-games');
      toast.error(err.message ?? 'Failed to replace games');
    },
  });

  const handleCurrentChange = useCallback((id: string, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, current: value } : row)),
    );
  }, []);

  const handleReplacementChange = useCallback((id: string, value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, replacement: value } : row,
      ),
    );
  }, []);

  const handleRemove = useCallback((id: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((row) => row.id !== id);
    });
    setValidationMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleAddRow = useCallback(() => {
    setRows((prev) => {
      if (prev.length >= REPLACE_GAME_MAX_ROWS) return prev;
      return [...prev, createEmptyRow()];
    });
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Sticky header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <DashboardPageHeader
            title='Replace Game'
            description='Swap games by IGDB ID.'
            icon={IconArrowsExchange}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-2xl space-y-6">
          {/* Input form */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Swap</CardTitle>
                  <CardDescription className="mt-1">
                    Up to {REPLACE_GAME_MAX_ROWS} games.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRow}
                  disabled={rows.length >= REPLACE_GAME_MAX_ROWS || applyMutation.isPending}
                  className="flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <IconPlus size={14} aria-hidden="true" />
                  Add row
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {rows.map((row) => (
                <RowWithValidation
                  key={row.id}
                  row={row}
                  onCurrentChange={handleCurrentChange}
                  onReplacementChange={handleReplacementChange}
                  onRemove={handleRemove}
                  canRemove={rows.length > 1}
                  onValidationChange={handleValidationChange}
                />
              ))}

              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => applyMutation.mutate()}
                  disabled={!allPairsValid || applyMutation.isPending}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {applyMutation.isPending ? (
                    <IconLoader
                      size={16}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <IconPlayerPlay size={16} aria-hidden="true" />
                  )}
                  Apply
                </Button>
                <span className="text-xs text-muted-foreground">
                  {rows.length} / {REPLACE_GAME_MAX_ROWS} pairs
                  {!allPairsValid && rows.length > 0 && (
                    <> &mdash; all pairs must pass validation</>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Results table */}
          {results !== null && (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  Post-update state from the database.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ReplaceGameResultsTable results={results} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
