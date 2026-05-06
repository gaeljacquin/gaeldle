'use client';

import { useState, useCallback, useMemo } from 'react';
import { useUser } from '@stackframe/stack';
import { addGame } from '@/lib/services/game.service';
import { IgdbIdAddRow } from '@/components/igdb-id-add-row';
import type { IgdbIdAddValidationState } from '@/lib/hooks/use-igdb-id-add-validation';
import { Button } from '@workspace/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@workspace/ui/card';
import {
  IconCirclePlus,
  IconPlus,
  IconPlayerPlay,
  IconLoader,
  IconCircleCheck,
  IconCircleX,
  IconExternalLink,
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { ADD_GAME_MAX_ROWS } from '@workspace/constants';
import { DashboardPageHeader } from '@/components/dashboard-header';

interface AddGameRowData {
  id: string;
  igdbId: string;
}

function createEmptyRow(): AddGameRowData {
  return { id: crypto.randomUUID(), igdbId: '' };
}

function parsePositiveInt(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number.parseInt(trimmed, 10);
  if (Number.isNaN(n) || n <= 0 || String(n) !== trimmed) return null;
  return n;
}

export interface AddGameResult {
  igdbId: number;
  gameName: string | null;
  operation: 'created' | 'updated';
  gameDbId: number | null;
  error: string | null;
}

function OperationCell({ result }: Readonly<{ result: AddGameResult }>) {
  if (result.error) {
    return (
      <div className="flex items-center gap-1.5 text-destructive">
        <IconCircleX size={14} aria-hidden="true" />
        <span className="text-xs font-medium">Error</span>
      </div>
    );
  }

  if (result.operation === 'created') {
    return (
      <div className="flex items-center gap-1.5 text-green-600">
        <IconCircleCheck size={14} aria-hidden="true" />
        <span className="text-xs font-medium">Created</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-yellow-600">
      <IconCircleCheck size={14} aria-hidden="true" />
      <span className="text-xs font-medium">Updated</span>
    </div>
  );
}

interface ResultsTableProps {
  results: AddGameResult[];
  onAddMore: () => void;
}

function ResultsTable({ results, onAddMore }: Readonly<ResultsTableProps>) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Results</CardTitle>
            <CardDescription className="mt-1">
              {results.length} game{results.length === 1 ? '' : 's'} processed.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddMore}
            className="flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <IconPlus size={14} aria-hidden="true" />
            Add More
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Game Name
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  IGDB ID
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Operation
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Link
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, i) => (
                <tr
                  key={result.igdbId}
                  className={cn(
                    'border-b last:border-0',
                    i % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                  )}
                >
                  <td className="px-4 py-3 text-xs">
                    {result.gameName ?? (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                    {result.error ? (
                      <p className="text-destructive mt-0.5">{result.error}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {result.igdbId}
                  </td>
                  <td className="px-4 py-3">
                    <OperationCell result={result} />
                  </td>
                  <td className="px-4 py-3">
                    {result.gameDbId && !result.error ? (
                      <a
                        href={`/dashboard/games/${result.igdbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        aria-label={`Open ${result.gameName ?? 'game'} detail page`}
                      >
                        <IconExternalLink size={12} aria-hidden="true" />
                        View
                      </a>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface RowWithValidationProps {
  row: AddGameRowData;
  isLastRow: boolean;
  onIgdbIdChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  onValidationChange: (id: string, state: IgdbIdAddValidationState) => void;
  isDuplicate: boolean;
}

function RowWithValidation({
  row,
  isLastRow,
  onIgdbIdChange,
  onRemove,
  onValidationChange,
  isDuplicate,
}: Readonly<RowWithValidationProps>) {
  return (
    <IgdbIdAddRow
      rowId={row.id}
      value={row.igdbId}
      onChange={(value) => onIgdbIdChange(row.id, value)}
      onRemove={() => onRemove(row.id)}
      isLastRow={isLastRow}
      onValidationChange={onValidationChange}
      isDuplicate={isDuplicate}
    />
  );
}

export function AddGame() {
  useUser({ or: 'redirect' });

  const [rows, setRows] = useState<AddGameRowData[]>([createEmptyRow()]);
  const [validationMap, setValidationMap] = useState<
    Record<string, IgdbIdAddValidationState>
  >({});
  const [results, setResults] = useState<AddGameResult[] | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const handleValidationChange = useCallback(
    (id: string, state: IgdbIdAddValidationState) => {
      setValidationMap((prev) => {
        const current = prev[id];
        if (
          current?.canAdd === state.canAdd &&
          current?.isLoading === state.isLoading &&
          current?.isReady === state.isReady &&
          current?.alreadyInDb === state.alreadyInDb &&
          current?.existsOnIgdb === state.existsOnIgdb
        ) {
          return prev;
        }
        return { ...prev, [id]: state };
      });
    },
    [],
  );

  const handleIgdbIdChange = useCallback((id: string, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, igdbId: value } : row)),
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
      if (prev.length >= ADD_GAME_MAX_ROWS) return prev;
      return [...prev, createEmptyRow()];
    });
  }, []);

  const handleAddMore = useCallback(() => {
    setResults(null);
    setRows([createEmptyRow()]);
    setValidationMap({});
  }, []);

  const duplicateRowIds = useMemo(() => {
    const idToRowIds = new Map<number, string[]>();
    for (const row of rows) {
      const n = parsePositiveInt(row.igdbId);
      if (n === null) continue;
      const state = validationMap[row.id];
      if (!state?.isReady || state.existsOnIgdb !== true) continue;
      if (!idToRowIds.has(n)) idToRowIds.set(n, []);
      idToRowIds.get(n)!.push(row.id);
    }
    const dupes = new Set<string>();
    for (const rowIds of idToRowIds.values()) {
      if (rowIds.length > 1) rowIds.forEach((id) => dupes.add(id));
    }
    return dupes;
  }, [rows, validationMap]);

  const hasDuplicates = duplicateRowIds.size > 0;

  const allCanAdd =
    rows.length > 0 &&
    !hasDuplicates &&
    rows.every((row) => validationMap[row.id]?.canAdd === true);

  const hasAnyNotFound =
    rows.length > 1 &&
    rows.some(
      (row) =>
        validationMap[row.id]?.isReady === true &&
        validationMap[row.id]?.existsOnIgdb === false,
    );

  const handleApply = useCallback(async () => {
    setIsMutating(true);
    try {
      const settled = await Promise.allSettled(
        rows.map((row) => addGame(Number.parseInt(row.igdbId, 10))),
      );

      const addResults: AddGameResult[] = rows.map((row, i) => {
        const outcome = settled[i];
        const igdbId = Number.parseInt(row.igdbId, 10);

        if (outcome.status === 'fulfilled') {
          const syncResult = outcome.value;
          return {
            igdbId,
            gameName: syncResult.data.name,
            operation: syncResult.operation,
            gameDbId: syncResult.data.igdbId,
            error: null,
          };
        }

        const err = outcome.reason;
        return {
          igdbId,
          gameName: validationMap[row.id]?.gameName ?? null,
          operation: 'created' as const,
          gameDbId: null,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      });

      setResults(addResults);
    } finally {
      setIsMutating(false);
    }
  }, [rows, validationMap]);

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Sticky header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <DashboardPageHeader
            title="Add Game"
            description="Add games by IGDB ID."
            icon={IconCirclePlus}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-2xl space-y-6">
          {results === null ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Add</CardTitle>
                    <CardDescription className="mt-1">
                      Up to {ADD_GAME_MAX_ROWS} games.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRow}
                    disabled={rows.length >= ADD_GAME_MAX_ROWS || isMutating}
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
                    isLastRow={rows.length === 1}
                    onIgdbIdChange={handleIgdbIdChange}
                    onRemove={handleRemove}
                    onValidationChange={handleValidationChange}
                    isDuplicate={duplicateRowIds.has(row.id)}
                  />
                ))}

                {hasAnyNotFound ? (
                  <p className="text-xs text-destructive pt-1">
                    One or more IGDB IDs were not found. Fix them or remove the
                    affected rows before applying.
                  </p>
                ) : null}

                {hasDuplicates ? (
                  <p className="text-xs text-destructive pt-1">
                    Duplicate IGDB IDs detected. Fix or remove the highlighted
                    rows before applying.
                  </p>
                ) : null}

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={handleApply}
                    disabled={!allCanAdd || isMutating}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {isMutating ? (
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
                    {rows.length} / {ADD_GAME_MAX_ROWS} rows
                    {!allCanAdd && rows.length > 0 ? (
                      <> &mdash; all rows must pass validation</>
                    ) : null}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ResultsTable results={results} onAddMore={handleAddMore} />
          )}
        </div>
      </div>
    </div>
  );
}
