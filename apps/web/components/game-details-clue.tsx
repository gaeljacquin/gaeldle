'use client';

import { useState, useMemo } from 'react';
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { getGameByIgdbId, generateClue } from '@/lib/services/game.service';
import { Button } from '@workspace/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@workspace/ui/card';
import { toast } from 'sonner';
import { IconCopy, IconCheck, IconRefresh } from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { Checkbox } from '@workspace/ui/checkbox';
import { Label } from '@workspace/ui/label';
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

  const queryClient = useQueryClient();
  const { data: game } = useSuspenseQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  const generatedClue = useMemo(() => {
    if (!game || !game.clue) {
      return null;
    }

    return game.clue as {
      clue: string;
      prompt: string;
      provider: string;
      model: string;
      createdAt?: string;
    };
  }, [game]);

  const generateClueMutation = useMutation({
    mutationFn: () => generateClue(Number.parseInt(igdbId, 10)),
    onMutate: () => {
      toast.loading('Generating clue...', { id: generateClueToastId });
    },
    onSuccess: () => {
      toast.success('Clue generated successfully!', {
        id: generateClueToastId,
      });
      queryClient.invalidateQueries({ queryKey: ['game', igdbId] });
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to generate clue', { id: generateClueToastId });
    },
  });

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
                      Copy Clue
                    </>
                  )}
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

          <Button
            variant="outline"
            className={cn(
              'w-full font-bold h-11 rounded-none text-white hover:text-white transition-all',
              generateClueMutation.isPending
                ? 'bg-slate-500 hover:bg-slate-500 cursor-not-allowed'
                : 'bg-slate-600 hover:bg-slate-700 cursor-pointer',
            )}
            onClick={handleButtonClick}
            disabled={generateClueMutation.isPending}
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
    </div>
  );
}
