'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ViewTransition } from 'react';
import {
  IconPlayerPlay,
  IconLoader,
  IconCheck,
  IconAlertCircle,
  IconArrowBackUp,
  IconPencil,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/dashboard-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@workspace/ui/card';
import { Button } from '@workspace/ui/button';
import { Input } from '@workspace/ui/input';
import { Label } from '@workspace/ui/label';
import { Textarea } from '@workspace/ui/textarea';
import { Checkbox } from '@workspace/ui/checkbox';
import { Badge } from '@workspace/ui/badge';
import { cn } from '@workspace/ui/lib/utils';
import {
  allGameModesQueryOptions,
  updateGameMode,
} from '@/lib/services/game-mode.service';

type EditFormValues = {
  slug: string;
  title: string;
  description: string;
  level: 'easy' | 'medium' | 'hard';
  maxAttempts: number;
  isActive: boolean;
  isCoverArt: boolean;
};

export default function EditModesView() {
  const queryClient = useQueryClient();
  const {
    data: allGameModes,
    isLoading,
    error,
  } = useQuery(allGameModesQueryOptions);

  const [selectedModeSlug, setSelectedModeSlug] = useState<string | null>(null);
  const [formEdits, setFormEdits] = useState<Record<string, EditFormValues>>(
    {},
  );
  const [isSlugEditable, setIsSlugEditable] = useState(false);

  const defaultModeSlug = allGameModes?.[0]?.slug ?? null;
  const currentSlug = selectedModeSlug ?? defaultModeSlug;
  const selectedMode = allGameModes?.find((m) => m.slug === currentSlug);

  const getFormValue = <K extends keyof EditFormValues>(
    key: K,
  ): EditFormValues[K] => {
    if (!selectedMode || !currentSlug) {
      if (key === 'isActive' || key === 'isCoverArt') {
        return false as unknown as EditFormValues[K];
      }

      if (key === 'maxAttempts') {
        return 3 as unknown as EditFormValues[K];
      }

      if (key === 'level') {
        return 'easy' as unknown as EditFormValues[K];
      }

      return '' as unknown as EditFormValues[K];
    }

    if (formEdits[currentSlug] && formEdits[currentSlug][key] !== undefined) {
      return formEdits[currentSlug][key];
    }

    const val = selectedMode[key as keyof typeof selectedMode];

    if (key === 'isActive' || key === 'isCoverArt') {
      return (val === 1) as unknown as EditFormValues[K];
    }

    return val as unknown as EditFormValues[K];
  };

  const setFormValue = <K extends keyof EditFormValues>(
    key: K,
    value: EditFormValues[K],
  ) => {
    if (!currentSlug || !selectedMode) {
      return;
    }

    setFormEdits((prev) => {
      const currentEdits = prev[currentSlug] || {
        title: selectedMode.title,
        slug: selectedMode.slug,
        description: selectedMode.description,
        level: selectedMode.level as 'easy' | 'medium' | 'hard',
        maxAttempts: selectedMode.maxAttempts,
        isActive: selectedMode.isActive === 1,
        isCoverArt: selectedMode.isCoverArt === 1,
      };
      return {
        ...prev,
        [currentSlug]: {
          ...currentEdits,
          [key]: value,
        },
      };
    });
  };

  const isEdited = (slug: string | null) => {
    if (!slug) {
      return false;
    }

    const mode = allGameModes?.find((m) => m.slug === slug);

    if (!mode) {
      return false;
    }

    const edits = formEdits[slug];

    if (!edits) {
      return false;
    }

    return (
      edits.title !== mode.title ||
      edits.slug !== mode.slug ||
      edits.description !== mode.description ||
      edits.level !== mode.level ||
      edits.maxAttempts !== mode.maxAttempts ||
      edits.isActive !== (mode.isActive === 1) ||
      edits.isCoverArt !== (mode.isCoverArt === 1)
    );
  };

  const mutation = useMutation({
    mutationFn: async (slug: string) => {
      const mode = allGameModes?.find((m) => m.slug === slug);

      if (!mode) {
        throw new Error('Mode not found');
      }

      const edits = formEdits[slug];

      if (!edits) {
        return;
      }

      await updateGameMode({
        id: mode.id,
        slug: edits.slug,
        title: edits.title,
        description: edits.description,
        level: edits.level,
        maxAttempts: edits.maxAttempts,
        isActive: edits.isActive ? 1 : 0,
        isCoverArt: edits.isCoverArt ? 1 : 0,
      });
    },
    onSuccess: (_, oldSlug) => {
      toast.success('Game mode updated');

      const edits = formEdits[oldSlug];
      if (edits && edits.slug !== oldSlug) {
        setSelectedModeSlug(edits.slug);
      }

      setFormEdits((prev) => {
        const next = { ...prev };
        delete next[oldSlug];

        return next;
      });

      setIsSlugEditable(false);

      queryClient.invalidateQueries({ queryKey: ['allGameModes'] });
      queryClient.invalidateQueries({ queryKey: ['gameModes'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update game mode');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentSlug) {
      return;
    }

    mutation.mutate(currentSlug);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full bg-background">
        <DashboardHeader
          title="Edit Modes"
          icon={IconPlayerPlay}
          dashboardBacklinkProps={{
            text: 'Utilities',
            href: '/dashboard/utilities',
          }}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-80 lg:w-96 shrink-0 space-y-4">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-muted animate-pulse rounded-xl"
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 h-96 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-full bg-background">
        <DashboardHeader
          title="Edit Modes"
          icon={IconPlayerPlay}
          dashboardBacklinkProps={{
            text: 'Utilities',
            href: '/dashboard/utilities',
          }}
        />
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-96 text-destructive gap-3">
          <IconAlertCircle size={40} />
          <h2 className="text-lg font-bold">Failed to load game modes</h2>
          <p className="text-sm text-muted-foreground">
            {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ViewTransition>
      <div className="flex flex-col min-h-full bg-background">
        <DashboardHeader
          title="Edit Modes"
          icon={IconPlayerPlay}
          dashboardBacklinkProps={{
            text: 'Utilities',
            href: '/dashboard/utilities',
          }}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-80 lg:w-96 shrink-0 space-y-4">
              <div className="flex flex-col gap-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {allGameModes?.map((mode) => {
                  const isSelected = mode.slug === currentSlug;
                  const hasEdits = isEdited(mode.slug);

                  return (
                    <button
                      key={mode.slug}
                      type="button"
                      onClick={() => {
                        setSelectedModeSlug(mode.slug);
                        setIsSlugEditable(false);
                      }}
                      className={cn(
                        'flex flex-col w-full text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group',
                        isSelected
                          ? 'border-white/10 shadow-lg opacity-100'
                          : 'border-white/10 hover:border-white/30 hover:shadow-md opacity-80 hover:opacity-100',
                      )}
                      style={{ background: mode.gradient }}
                    >
                      <div
                        className={cn(
                          'absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                          isSelected && 'opacity-100',
                        )}
                        style={{ background: 'var(--gradient-card-overlay)' }}
                      />

                      <div className="flex items-center justify-between w-full relative z-10">
                        <span className="font-bold text-sm text-white">
                          {mode.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-foreground uppercase">
                            {mode.level}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full mt-2 relative z-10">
                        <span className="text-[11px] font-mono text-white">
                          /{mode.slug}
                        </span>

                        {hasEdits && (
                          <Badge
                            variant="default"
                            className="bg-amber-500 hover:bg-amber-500 text-black border-amber-500 text-[11px] h-5.5 px-2 py-0.5 font-bold"
                          >
                            Unsaved
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 w-full">
              {selectedMode ? (
                <Card className="shadow-lg border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {selectedMode.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Ordinal {selectedMode.ordinal}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-1.5">
                          <Label
                            htmlFor="title"
                            className="text-xs font-semibold"
                          >
                            Title
                          </Label>
                          <Input
                            id="title"
                            type="text"
                            value={getFormValue('title')}
                            onChange={(e) =>
                              setFormValue('title', e.target.value)
                            }
                            placeholder="Game Mode Title"
                            className="h-10"
                            required
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <Label
                            htmlFor="slug"
                            className="text-xs font-semibold"
                          >
                            Slug
                          </Label>
                          <div className="relative flex items-center">
                            <Input
                              id="slug"
                              type="text"
                              value={getFormValue('slug')}
                              onChange={(e) =>
                                setFormValue('slug', e.target.value)
                              }
                              disabled={!isSlugEditable}
                              placeholder="game-mode-slug"
                              className="h-10 font-mono pr-10 w-full"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setIsSlugEditable(!isSlugEditable)}
                              className="absolute right-3 p-1 rounded hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                              title={
                                isSlugEditable
                                  ? 'Disable editing slug'
                                  : 'Enable editing slug'
                              }
                            >
                              <IconPencil
                                size={16}
                                className={cn(isSlugEditable && 'text-primary')}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label
                          htmlFor="description"
                          className="text-xs font-semibold"
                        >
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={getFormValue('description')}
                          onChange={(e) =>
                            setFormValue('description', e.target.value)
                          }
                          placeholder="Provide a description of the game mode..."
                          className="min-h-24 resize-y"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2 md:col-span-2">
                          <Label className="text-xs font-semibold">
                            Difficulty Level
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['easy', 'medium', 'hard'] as const).map(
                              (lvl) => {
                                const isSelected =
                                  getFormValue('level') === lvl;

                                return (
                                  <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => setFormValue('level', lvl)}
                                    className={cn(
                                      'flex flex-col items-center justify-center p-3 border rounded-xl transition-all capitalize text-xs font-semibold cursor-pointer',
                                      isSelected
                                        ? lvl === 'easy'
                                          ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400 ring-1 ring-green-500 shadow-sm'
                                          : lvl === 'medium'
                                            ? 'bg-yellow-500/10 border-yellow-500 text-yellow-600 dark:text-yellow-400 ring-1 ring-yellow-500 shadow-sm'
                                            : 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 ring-1 ring-red-500 shadow-sm'
                                        : 'bg-card border-border hover:bg-muted/50 text-muted-foreground',
                                    )}
                                  >
                                    {lvl}
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </div>

                        {/* Max Attempts */}
                        <div className="flex flex-col gap-1.5 md:col-span-1">
                          <Label
                            htmlFor="maxAttempts"
                            className="text-xs font-semibold"
                          >
                            Max Attempts
                          </Label>
                          <Input
                            id="maxAttempts"
                            type="number"
                            min={1}
                            max={20}
                            value={getFormValue('maxAttempts')}
                            onChange={(e) =>
                              setFormValue(
                                'maxAttempts',
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="h-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 border border-border p-4 bg-muted/10 rounded-xl">
                        <div className="flex items-center space-x-3 justify-between">
                          <div className="flex flex-col space-y-1 pr-4">
                            <Label
                              htmlFor="isActive"
                              className="text-sm font-semibold cursor-pointer select-none"
                            >
                              Active
                            </Label>
                            <span className="text-xs text-muted-foreground">
                              Show this mode in navigation lists and selection
                              grids.
                            </span>
                          </div>
                          <Checkbox
                            id="isActive"
                            checked={getFormValue('isActive')}
                            onCheckedChange={(checked) =>
                              setFormValue('isActive', !!checked)
                            }
                            className="size-5"
                          />
                        </div>

                        <div className="h-px bg-border w-full" />

                        <div className="flex items-center space-x-3 justify-between">
                          <div className="flex flex-col space-y-1 pr-4">
                            <Label
                              htmlFor="isCoverArt"
                              className="text-sm font-semibold cursor-pointer select-none"
                            >
                              Cover Art
                            </Label>
                            <span className="text-xs text-muted-foreground">
                              Toggle cover art features, layouts and gameplay
                              rules for this mode.
                            </span>
                          </div>
                          <Checkbox
                            id="isCoverArt"
                            checked={getFormValue('isCoverArt')}
                            onCheckedChange={(checked) =>
                              setFormValue('isCoverArt', !!checked)
                            }
                            className="size-5"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                          type="submit"
                          disabled={
                            !isEdited(currentSlug) ||
                            isSlugEditable ||
                            mutation.isPending
                          }
                          className="flex-1 h-11 flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          {mutation.isPending ? (
                            <>
                              <IconLoader className="animate-spin" size={16} />
                              Saving...
                            </>
                          ) : (
                            <>
                              <IconCheck size={16} />
                              Save
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            !isEdited(currentSlug) || mutation.isPending
                          }
                          onClick={() => {
                            if (!currentSlug) {
                              return;
                            }

                            setFormEdits((prev) => {
                              const next = { ...prev };
                              delete next[currentSlug];
                              return next;
                            });
                          }}
                          className="h-11 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <IconArrowBackUp size={16} />
                          Discard
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-48 border border-dashed border-muted-foreground/20 rounded-xl flex items-center justify-center text-muted-foreground">
                  Select a game mode from the list to configure
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
