'use client';

import { useState, useCallback, useMemo, ViewTransition } from 'react';
import { useForm } from '@tanstack/react-form';
import { addGame } from '@/lib/services/game.service';
import { IgdbIdAddEntry } from '@/components/igdb-id-add-entry';
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
import { z } from 'zod';

interface AddGameEntryData {
  id: string;
  igdbId: string;
}

function createEmptyEntry(): AddGameEntryData {
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
  onChange: z
    .string()
    .refine(
      (val) =>
        !val.trim() ||
        (/^\d+$/.test(val.trim()) && Number.parseInt(val, 10) > 0),
      'Must be a positive integer',
    ),
  onBlur: z
    .string()
    .min(1, 'IGDB ID is required')
    .refine(
      (val) => /^\d+$/.test(val.trim()) && Number.parseInt(val, 10) > 0,
      'Must be a positive integer',
    ),
};

export function NewGame() {
  const [validationMap, setValidationMap] = useState<
    Record<string, IgdbIdAddValidationState>
  >({});
  const [results, setResults] = useState<AddGameResult[] | null>(null);

  const defaultValues = useMemo(
    () => ({
      games: [createEmptyEntry()] as AddGameEntryData[],
    }),
    [],
  );

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const settled = await Promise.allSettled(
          value.games.map((entry) =>
            addGame(Number.parseInt(entry.igdbId, 10)),
          ),
        );

        const addResults: AddGameResult[] = value.games.map((entry, i) => {
          const outcome = settled[i];
          const igdbId = Number.parseInt(entry.igdbId, 10);

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
            gameName: validationMap[entry.id]?.gameName ?? null,
            operation: 'created' as const,
            gameId: null,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        });

        setResults(addResults);
      } catch (err) {
        console.error('Error:', (err as Error).message);
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
      <form.Field name="games" mode="array">
        {(gamesField) => (
          <form.Subscribe selector={(state) => [state.isSubmitting] as const}>
            {([isSubmitting]) => {
              const games = gamesField.state.value;
              const duplicateEntryIds = (() => {
                const idToEntryIds = new Map<number, string[]>();

                for (const entry of games) {
                  const n = Number.parseInt(entry.igdbId, 10);

                  if (Number.isNaN(n)) {
                    continue;
                  }

                  const state = validationMap[entry.id];

                  if (!state?.isReady || state.existsOnIgdb !== true) {
                    continue;
                  }

                  if (!idToEntryIds.has(n)) {
                    idToEntryIds.set(n, []);
                  }

                  idToEntryIds.get(n)!.push(entry.id);
                }
                const dupes = new Set<string>();

                for (const entryIds of idToEntryIds.values()) {
                  if (entryIds.length > 1) {
                    entryIds.forEach((id) => dupes.add(id));
                  }
                }

                return dupes;
              })();

              const hasDuplicates = duplicateEntryIds.size > 0;

              const allCanAdd =
                games.length > 0 &&
                !hasDuplicates &&
                games.every(
                  (entry) => validationMap[entry.id]?.canAdd === true,
                );

              const hasAnyNotFound =
                games.length > 1 &&
                games.some(
                  (entry) =>
                    validationMap[entry.id]?.isReady === true &&
                    validationMap[entry.id]?.existsOnIgdb === false,
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
                                gamesField.pushValue(createEmptyEntry());
                              }
                            }}
                            disabled={
                              games.length >= ADD_GAME_MAX_ROWS || isSubmitting
                            }
                            className="flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <IconPlus size={14} aria-hidden="true" />
                            Add entry ({games.length} / {ADD_GAME_MAX_ROWS})
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            All entries must pass validation before clicking
                            apply.
                          </span>
                        </div>
                      ) : null
                    }
                  />

                  <div className="container mx-auto px-4 py-8 flex-1">
                    {results === null ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {games.map((entry, index) => (
                          <form.Field
                            key={entry.id}
                            name={`games[${index}].igdbId`}
                            validators={igdbIdValidators}
                          >
                            {(field) => (
                              <IgdbIdAddEntry
                                value={field.state.value}
                                onChange={(val) => field.handleChange(val)}
                                onBlur={field.handleBlur}
                                onRemove={() => {
                                  if (games.length > 1) {
                                    gamesField.removeValue(index);
                                    setValidationMap((prev) => {
                                      const next = { ...prev };
                                      delete next[entry.id];
                                      return next;
                                    });
                                  }
                                }}
                                isLastEntry={games.length === 1}
                                entryId={entry.id}
                                onValidationChange={handleValidationChange}
                                isDuplicate={duplicateEntryIds.has(entry.id)}
                                error={
                                  field.state.meta.isTouched
                                    ? ((field.state.meta.errors?.[0] as Error)
                                        ?.message ??
                                      (field.state.meta.errors?.[0] as Error))
                                    : undefined
                                }
                              />
                            )}
                          </form.Field>
                        ))}

                        {hasAnyNotFound ? (
                          <p className="text-xs text-destructive pt-1 md:col-span-2">
                            One or more IGDB IDs were not found. Fix them or
                            remove the affected entries before applying.
                          </p>
                        ) : null}

                        {hasDuplicates ? (
                          <p className="text-xs text-destructive pt-1 md:col-span-2">
                            Duplicate IGDB IDs detected. Fix or remove the
                            highlighted entries before applying.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <ResultsTable
                        results={results}
                        onAddMore={handleAddMore}
                      />
                    )}
                  </div>
                </form>
              );
            }}
          </form.Subscribe>
        )}
      </form.Field>
    </ViewTransition>
  );
}
