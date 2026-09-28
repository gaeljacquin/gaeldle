'use client';

import { useState } from 'react';
import { AI_PROVIDERS, isAiProvider, type AiProvider } from '@workspace/shared';
import {
  useSuspenseQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getGameByIgdbId,
  generateClue,
  getClueHistory,
  restoreClue,
  archiveActiveClue,
  deleteClueHistoryEntry,
} from '@/lib/services/game.service';
import { Button } from '@workspace/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@workspace/ui/card';
import { toast } from 'sonner';
import {
  IconCopy,
  IconCheck,
  IconRefresh,
  IconTrash,
  IconArchive,
  IconRotateClockwise,
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { Checkbox } from '@workspace/ui/checkbox';
import { Label } from '@workspace/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/alert-dialog';

const generateClueToastId = 'generate-clue';

export default function GameDetailsClueTab({ igdbId }: { igdbId: string }) {
  const [copiedActive, setCopiedActive] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [clueToDelete, setClueToDelete] = useState<{
    id: number;
    clue: string;
  } | null>(null);
  const [clueToRestore, setClueToRestore] = useState<{
    id: number;
    clue: string;
  } | null>(null);
  const [providerVal, setProviderVal] = useState<AiProvider>(
    AI_PROVIDERS.default,
  );

  const queryClient = useQueryClient();
  const { data: game } = useSuspenseQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  const { data: clueHistory, refetch: refetchClueHistory } = useQuery({
    queryKey: ['game-clue-history', igdbId],
    queryFn: () => getClueHistory(Number.parseInt(igdbId, 10)),
  });

  const generatedClue = game.clue
    ? (game.clue as {
        clue: string;
        prompt: string;
        provider: string;
        model: string;
        createdAt?: string;
      })
    : null;

  const generateClueMutation = useMutation({
    mutationFn: () => generateClue(Number.parseInt(igdbId, 10), providerVal),
    onMutate: () => {
      toast.loading('Generating clue...', { id: generateClueToastId });
    },
    onSuccess: () => {
      toast.success(`Clue generated successfully for ${game.name}!`, {
        id: generateClueToastId,
      });
      queryClient.invalidateQueries({ queryKey: ['game', igdbId] });
      refetchClueHistory();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to generate clue', { id: generateClueToastId });
    },
  });

  const restoreClueMutation = useMutation({
    mutationFn: (historyId: number) =>
      restoreClue(Number.parseInt(igdbId, 10), historyId),
    onMutate: () => {
      toast.loading('Restoring clue...', { id: 'restore-clue' });
    },
    onSuccess: () => {
      toast.success('Clue restored successfully!', { id: 'restore-clue' });
      queryClient.invalidateQueries({ queryKey: ['game', igdbId] });
      refetchClueHistory();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to restore clue', { id: 'restore-clue' });
    },
  });

  const archiveActiveClueMutation = useMutation({
    mutationFn: () => archiveActiveClue(Number.parseInt(igdbId, 10)),
    onMutate: () => {
      toast.loading('Archiving clue...', { id: 'archive-clue' });
    },
    onSuccess: () => {
      toast.success('Clue archived successfully!', { id: 'archive-clue' });
      queryClient.invalidateQueries({ queryKey: ['game', igdbId] });
      refetchClueHistory();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to archive clue', { id: 'archive-clue' });
    },
  });

  const deleteClueHistoryMutation = useMutation({
    mutationFn: (historyId: number) =>
      deleteClueHistoryEntry(Number.parseInt(igdbId, 10), historyId),
    onMutate: () => {
      toast.loading('Deleting clue from history...', {
        id: 'delete-history-clue',
      });
    },
    onSuccess: () => {
      toast.success('Clue deleted from history!', {
        id: 'delete-history-clue',
      });
      refetchClueHistory();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to delete clue from history', {
        id: 'delete-history-clue',
      });
    },
  });

  const isChangingClues =
    archiveActiveClueMutation.isPending || deleteClueHistoryMutation.isPending;

  const handleCopyActive = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedActive(true);
    toast.success('Clue copied to clipboard!');
    setTimeout(() => setCopiedActive(false), 2000);
  };

  const handleButtonClick = () => {
    if (generatedClue) {
      setIsConfirmOpen(true);
    } else {
      generateClueMutation.mutate();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Generator & Active Clue Card */}
      <Card className="rounded-none border-2 border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg font-black uppercase tracking-wider">
            Clue Generator
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-mono">
            <p>Model: {generatedClue?.model ?? 'N/A'}</p>
            <p>Provider: {generatedClue?.provider ?? 'N/A'}</p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {generatedClue ? (
            <div className="space-y-4">
              <div className="relative p-6 bg-primary/5 border-l-4 border-primary rounded-none font-serif text-lg leading-relaxed text-foreground select-text group">
                <p>&ldquo;{generatedClue.clue}&rdquo;</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyActive(generatedClue.clue)}
                  disabled={isChangingClues}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity size-8 rounded-none border hover:bg-background cursor-pointer"
                >
                  {copiedActive ? (
                    <IconCheck className="size-4 text-green-500" />
                  ) : (
                    <IconCopy className="size-4" />
                  )}
                </Button>
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                <span>
                  Generated:{' '}
                  {generatedClue.createdAt
                    ? new Date(generatedClue.createdAt).toLocaleString(
                        undefined,
                        {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        },
                      )
                    : 'N/A'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyActive(generatedClue.clue)}
                  disabled={isChangingClues}
                  className="h-8 rounded-none px-3 font-semibold uppercase tracking-wider border-2 cursor-pointer flex items-center gap-1.5"
                >
                  {copiedActive ? (
                    <>
                      <IconCheck className="size-3.5 text-green-500" />
                      Copied Clue
                    </>
                  ) : (
                    <>
                      <IconCopy className="size-3.5" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsArchiveConfirmOpen(true)}
                  disabled={isChangingClues}
                  className="h-8 rounded-none px-3 font-semibold uppercase tracking-wider border-2 cursor-pointer flex items-center gap-1.5"
                >
                  <IconArchive className="size-3.5" />
                  Archive
                </Button>
              </div>

              {/* Collapsible Prompt Details for the Active Clue */}
              <div className="pt-2 border-t border-border">
                <Button
                  variant="link"
                  onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                  className="p-0 h-auto text-[10px] uppercase font-bold tracking-wider text-muted-foreground/75 hover:text-foreground cursor-pointer flex items-center"
                >
                  {isPromptExpanded
                    ? 'Hide Prompt Details'
                    : 'View Prompt Details'}
                </Button>

                {isPromptExpanded && (
                  <div className="mt-2 p-2 bg-muted/60 text-[10px] font-mono text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap border rounded-none">
                    {generatedClue.prompt}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed rounded-none bg-muted/10">
              <p className="text-sm text-muted-foreground font-medium">
                Empty clue.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Model / Provider
            </Label>
            <Select
              value={providerVal}
              onValueChange={(val) => {
                if (val && isAiProvider(val)) {
                  setProviderVal(val);
                }
              }}
              disabled={generateClueMutation.isPending}
            >
              <SelectTrigger className="w-full h-10 rounded-none bg-card/50 border-border text-sm flex">
                <SelectValue placeholder="Select provider">
                  {(value) =>
                    AI_PROVIDERS.options.find(
                      (provider) => provider.id === value,
                    )?.label ?? ''
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border border-border bg-popover rounded-none">
                {AI_PROVIDERS.options
                  .filter((provider) => provider.clueModel)
                  .map((provider) => (
                    <SelectItem
                      key={provider.id}
                      value={provider.id}
                      className="text-sm"
                    >
                      {provider.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className={cn(
              'w-full font-bold h-11 rounded-none text-white hover:text-white transition-all',
              generateClueMutation.isPending
                ? 'bg-slate-500 hover:bg-slate-500 cursor-not-allowed'
                : 'bg-slate-600 hover:bg-slate-700 cursor-pointer',
            )}
            onClick={handleButtonClick}
            disabled={generateClueMutation.isPending || isChangingClues}
          >
            <IconRefresh
              aria-hidden="true"
              className={cn(
                'mr-2 size-4',
                generateClueMutation.isPending && 'animate-spin',
              )}
            />
            {generateClueMutation.isPending
              ? 'Generating Clue...'
              : generatedClue
                ? 'Regenerate Clue'
                : 'Generate Clue'}
          </Button>
        </CardContent>
      </Card>

      {/* Included Fields Card */}
      <Card className="rounded-none border-2 border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Fields
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            The following fields below were used to generate the clue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {(
              [
                { id: 'f-name', label: 'Title', hasValue: !!game.name },
                { id: 'f-summary', label: 'Summary', hasValue: !!game.summary },
                {
                  id: 'f-storyline',
                  label: 'Storyline',
                  hasValue: !!game.storyline,
                },
                {
                  id: 'f-release',
                  label: 'Release Date',
                  hasValue: !!game.firstReleaseDate,
                },
                {
                  id: 'f-themes',
                  label: 'Themes',
                  hasValue: !!(game.themes as string[] | null)?.length,
                },
                {
                  id: 'f-keywords',
                  label: 'Keywords',
                  hasValue: !!(game.keywords as string[] | null)?.length,
                },
                {
                  id: 'f-modes',
                  label: 'Game Modes',
                  hasValue: !!(game.gameModes as string[] | null)?.length,
                },
                {
                  id: 'f-genres',
                  label: 'Genres',
                  hasValue: !!(game.genres as string[] | null)?.length,
                },
              ] as const
            ).map(({ id, label, hasValue }) => (
              <div key={id} className="flex items-center gap-2.5">
                <Checkbox
                  id={id}
                  checked={hasValue}
                  disabled
                  className="opacity-90 data-checked:bg-blue-600 data-checked:border-blue-600"
                />
                <Label
                  htmlFor={id}
                  className={cn(
                    'text-sm font-medium cursor-default',
                    hasValue
                      ? 'text-foreground'
                      : 'text-muted-foreground/40 line-through',
                  )}
                >
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clue History Card */}
      <Card className="rounded-none border-2 border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Clue History
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            View previous clues generated for this game and restore them.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {!clueHistory?.length ? (
            <div className="text-center py-8 border border-dashed rounded-none bg-muted/10">
              <p className="text-sm text-muted-foreground font-medium">
                No clue history found.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {clueHistory.map((item) => {
                if (item.id === null || item.clue === null) {
                  return null;
                }
                const historyId = item.id;
                const historyClue = item.clue;
                const isActive = generatedClue?.clue === historyClue;
                return (
                  <div
                    key={historyId}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <p className="text-sm font-medium leading-relaxed text-foreground select-text font-serif italic">
                        &ldquo;{historyClue}&rdquo;
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-mono">
                        <span>
                          {item.occurredAt
                            ? new Date(item.occurredAt).toLocaleString(
                                undefined,
                                {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                },
                              )
                            : 'N/A'}
                        </span>
                        <span>•</span>
                        <span>Model: {item.model ?? 'N/A'}</span>
                        <span>•</span>
                        <span>Provider: {item.provider ?? 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-start">
                      {isActive ? (
                        <span className="inline-flex h-8 items-center rounded-none border-2 border-input px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-50">
                          Current Clue
                        </span>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              restoreClueMutation.isPending || isChangingClues
                            }
                            onClick={() =>
                              setClueToRestore({
                                id: historyId,
                                clue: historyClue,
                              })
                            }
                            className="h-8 rounded-none px-3 font-semibold uppercase tracking-wider border-2 cursor-pointer text-xs"
                          >
                            <IconRotateClockwise className="mr-1 size-3.5" />
                            Restore
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isChangingClues}
                            onClick={() =>
                              setClueToDelete({
                                id: historyId,
                                clue: historyClue,
                              })
                            }
                            className="h-8 rounded-none px-3 font-semibold uppercase tracking-wider border-2 cursor-pointer text-xs text-destructive hover:text-destructive"
                          >
                            <IconTrash className="mr-1 size-3.5" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Regeneration */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase">
              Regenerate Clue?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to regenerate the clue? This will generate a
              new clue and overwrite the active one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-3">
            <AlertDialogCancel
              className="font-bold rounded-none flex-1 cursor-pointer"
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-none flex-1 cursor-pointer"
              onClick={() => {
                setIsConfirmOpen(false);
                generateClueMutation.mutate();
              }}
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Archiving */}
      <AlertDialog
        open={isArchiveConfirmOpen}
        onOpenChange={setIsArchiveConfirmOpen}
      >
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase">
              Archive Clue?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to archive the active clue? It will be
              removed from the clue generator and kept in clue history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-3">
            <AlertDialogCancel
              className="font-bold rounded-none flex-1 cursor-pointer"
              disabled={isChangingClues}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-none flex-1 cursor-pointer"
              disabled={isChangingClues}
              onClick={() => {
                archiveActiveClueMutation.mutate();
                setIsArchiveConfirmOpen(false);
              }}
            >
              {isChangingClues ? 'Archiving...' : 'Archive Clue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for History Deletion */}
      <AlertDialog
        open={clueToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setClueToDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase">
              Delete History Clue?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to remove this clue from history?
              <span className="block mt-3 p-4 bg-muted font-serif italic text-sm border-l-4 border-destructive select-text">
                &ldquo;{clueToDelete?.clue}&rdquo;
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-3">
            <AlertDialogCancel
              className="font-bold rounded-none flex-1 cursor-pointer"
              disabled={isChangingClues}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-none flex-1 cursor-pointer"
              disabled={isChangingClues}
              onClick={() => {
                deleteClueHistoryMutation.mutate(clueToDelete!.id);
                setClueToDelete(null);
              }}
            >
              {isChangingClues ? 'Deleting...' : 'Delete Clue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Restoration */}
      <AlertDialog
        open={clueToRestore !== null}
        onOpenChange={(open) => {
          if (!open) setClueToRestore(null);
        }}
      >
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase">
              Restore Clue?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to restore the selected clue? This will
              replace the currently active clue with:
              <span className="block mt-3 p-4 bg-muted font-serif italic text-sm border-l-4 border-primary select-text">
                &ldquo;{clueToRestore?.clue}&rdquo;
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-3">
            <AlertDialogCancel
              className="font-bold rounded-none flex-1 cursor-pointer"
              onClick={() => setClueToRestore(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-none flex-1 cursor-pointer"
              onClick={() => {
                restoreClueMutation.mutate(clueToRestore!.id);
                setClueToRestore(null);
              }}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
