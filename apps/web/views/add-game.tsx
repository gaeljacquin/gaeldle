'use client';

import { useState, useCallback, useMemo, ViewTransition } from 'react';
import { useForm } from '@tanstack/react-form';
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
import { ADD_GAME_MAX_ROWS } from '@workspace/shared';
import { DashboardHeader } from '@/components/dashboard-header';

interface AddGameRowData {
  id: string;
  igdbId: string;
}

function createEmptyRow(): AddGameRowData {
  return { id: crypto.randomUUID(), igdbId: '' };
}

export interface AddGameResult {
  igdbId: number;
  gameName: string | null;
  operation: 'created' | 'updated';
  gameId: number | null;
  error: string | null;
}

function OperationCell({ result }: { result: AddGameResult }) {
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

function ResultsTable({ results, onAddMore }: ResultsTableProps) {
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
                    {result.gameId && !result.error ? (
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

const igdbIdValidators = {
  onChange: ({ value }: { value: string }) => {
    if (!value.trim()) {
      return 'IGDB ID is required';
    }

    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed) || parsed <= 0) {
      return 'Must be a positive integer';
    }

    return undefined;
  },
};

export function NewGame() {
  const [validationMap, setValidationMap] = useState<
    Record<string, IgdbIdAddValidationState>
  >({});
  const [results, setResults] = useState<AddGameResult[] | null>(null);

  const defaultValues = useMemo(
    () => ({
      games: [createEmptyRow()] as AddGameRowData[],
    }),
    [],
  );

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const settled = await Promise.allSettled(
          value.games.map((row) => addGame(Number.parseInt(row.igdbId, 10))),
        );

        const addResults: AddGameResult[] = value.games.map((row, i) => {
          const outcome = settled[i];
          const igdbId = Number.parseInt(row.igdbId, 10);

          if (outcome.status === 'fulfilled') {
            const syncResult = outcome.value;

            return {
              igdbId,
              gameName: syncResult.data.name,
              operation: syncResult.operation,
              gameId: syncResult.data.igdbId,
              error: null,
            };
          }

          const err = outcome.reason;

          return {
            igdbId,
            gameName: validationMap[row.id]?.gameName ?? null,
            operation: 'created' as const,
            gameId: null,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        });

        setResults(addResults);
      } catch (err) {
        console.error('Error:', (err as Error).message)
      }
    },
  });

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

  const handleAddMore = useCallback(() => {
    setResults(null);
    form.reset();
    setValidationMap({});
  }, [form]);

  return (
    <ViewTransition>
      <form.Subscribe
        selector={(state) => [state.values.games, state.isSubmitting] as const}
      >
        {([games, isSubmitting]) => {
          const duplicateRowIds = (() => {
            const idToRowIds = new Map<number, string[]>();

            for (const row of games) {
              const n = Number.parseInt(row.igdbId, 10);

              if (Number.isNaN(n)) {
                continue;
              }

              const state = validationMap[row.id];

              if (!state?.isReady || state.existsOnIgdb !== true) {
                continue;
              }

              if (!idToRowIds.has(n)) {
                idToRowIds.set(n, []);
              }

              idToRowIds.get(n)!.push(row.id);
            }
            const dupes = new Set<string>();

            for (const rowIds of idToRowIds.values()) {
              if (rowIds.length > 1) {
                rowIds.forEach((id) => dupes.add(id));
              }
            }

            return dupes;
          })();

          const hasDuplicates = duplicateRowIds.size > 0;

          const allCanAdd =
            games.length > 0 &&
            !hasDuplicates &&
            games.every((row) => validationMap[row.id]?.canAdd === true);

          const hasAnyNotFound =
            games.length > 1 &&
            games.some(
              (row) =>
                validationMap[row.id]?.isReady === true &&
                validationMap[row.id]?.existsOnIgdb === false,
            );

          return (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void form.handleSubmit();
              }}
              className="flex flex-col min-h-full bg-background"
            >
              <DashboardHeader
                title="New Game"
                icon={IconCirclePlus}
                dashboardBacklinkProps={{
                  text: 'Utilities',
                  href: '/dashboard/utilities',
                }}
                extraElements={
                  results === null ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="submit"
                        disabled={!allCanAdd || isSubmitting}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? (
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (games.length < ADD_GAME_MAX_ROWS) {
                            form.setFieldValue('games', [...games, createEmptyRow()]);
                          }
                        }}
                        disabled={games.length >= ADD_GAME_MAX_ROWS || isSubmitting}
                        className="flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <IconPlus size={14} aria-hidden="true" />
                        Add entry ({games.length} / {ADD_GAME_MAX_ROWS})
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        All entries must pass validation before clicking apply.
                      </span>
                    </div>
                  ) : null
                }
              />

              <div className="container mx-auto px-4 py-8 flex-1">
                {results === null ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {games.map((row, index) => (
                      <form.Field
                        key={row.id}
                        name={`games[${index}].igdbId`}
                        validators={igdbIdValidators}
                      >
                        {(field) => (
                          <IgdbIdAddRow
                            value={field.state.value}
                            onChange={(val) => field.handleChange(val)}
                            onBlur={field.handleBlur}
                            onRemove={() => {
                              if (games.length > 1) {
                                form.setFieldValue(
                                  'games',
                                  games.filter((_, idx) => idx !== index),
                                );
                                setValidationMap((prev) => {
                                  const next = { ...prev };
                                  delete next[row.id];
                                  return next;
                                });
                              }
                            }}
                            isLastRow={games.length === 1}
                            rowId={row.id}
                            onValidationChange={handleValidationChange}
                            isDuplicate={duplicateRowIds.has(row.id)}
                            error={field.state.meta.errors?.[0] as string}
                          />
                        )}
                      </form.Field>
                    ))}

                    {hasAnyNotFound ? (
                      <p className="text-xs text-destructive pt-1 md:col-span-2">
                        One or more IGDB IDs were not found. Fix them or remove
                        the affected rows before applying.
                      </p>
                    ) : null}

                    {hasDuplicates ? (
                      <p className="text-xs text-destructive pt-1 md:col-span-2">
                        Duplicate IGDB IDs detected. Fix or remove the highlighted
                        rows before applying.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <ResultsTable results={results} onAddMore={handleAddMore} />
                )}
              </div>
            </form>
          );
        }}
      </form.Subscribe>
    </ViewTransition>
  );
}
