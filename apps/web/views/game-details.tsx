'use client';

import { use, useState, useMemo, Suspense, ViewTransition } from 'react';
import {
  DEFAULT_IMAGE_GEN_ART_STYLE,
  IMAGE_PROMPT_SUFFIX,
} from '@workspace/constants';
import {
  useQuery,
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getGameByIgdbId,
  deleteGame,
  syncGame,
  generateImage,
} from '@/lib/services/game.service';
import { DashboardPageHeader } from '@/components/dashboard-header';
import Image from 'next/image';
import { Button } from '@workspace/ui/button';
import { Card } from '@workspace/ui/card';
import { Textarea } from '@workspace/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  IconTrash,
  IconLayersIntersect,
  IconExternalLink,
  IconRefresh,
  IconBrush,
  IconDashboard,
  IconCalendar,
  IconDeviceGamepad,
} from '@tabler/icons-react';
import {
  Game,
  type ArtworkImage,
  type ArtStyle,
  artStyles,
} from '@workspace/api-contract';
import { cn } from '@workspace/ui/lib/utils';
import { Checkbox } from '@workspace/ui/checkbox';
import { Label } from '@workspace/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/tabs';
import { Badge } from '@/components/badge';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPromptPreview(
  game: Game,
  options: {
    includeStoryline: boolean;
    includeGenres: boolean;
    includeThemes: boolean;
    artStyle: string;
  },
): string {
  const parts: string[] = [];
  const style =
    artStyles.find((s) => s.value === options.artStyle) ?? artStyles[0];
  parts.push(
    `${style.descriptor} of iconic characters from "${game.name}" set within the game's distinct world`,
  );
  if (game.summary) parts.push(game.summary);
  if (options.includeStoryline && game.storyline) parts.push(game.storyline);
  const genres = game.genres as string[] | null;
  if (options.includeGenres && genres?.length)
    parts.push(`Genres: ${genres.join(', ')}`);
  const themes = game.themes as string[] | null;
  if (options.includeThemes && themes?.length)
    parts.push(`Themes: ${themes.join(', ')}`);
  const keywords = game.keywords as string[] | null;
  if (keywords?.length) parts.push(`Keywords: ${keywords.join(', ')}`);
  parts.push(IMAGE_PROMPT_SUFFIX);
  return parts.join('. ');
}

interface Company {
  name: string;
  developer: boolean;
  publisher: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded bg-muted-foreground/10', className)}
    />
  );
}

function SidebarContentSkeleton() {
  return (
    <>
      <div className="flex flex-wrap gap-2 justify-center">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </>
  );
}

function InfoTabSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ArtworksTabSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-40" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video w-full" />
        ))}
      </div>
    </div>
  );
}

function ImageGenTabSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex-1 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-60 w-full" />
        <Skeleton className="h-4 w-28" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  igdbId,
  onDeleteDialogOpen,
}: {
  igdbId: string;
  onDeleteDialogOpen: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: game } = useSuspenseQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  const syncMutation = useMutation({
    mutationFn: () => syncGame(Number.parseInt(igdbId, 10)),
    onSuccess: () => {
      toast.success('Game info was updated successfully');
      queryClient.invalidateQueries({ queryKey: ['game', igdbId] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
    onError: (err) => {
      toast.error('Failed to sync game info');
      console.error(err);
    },
  });

  return (
    <>
      {/* Badges */}
      <div className="flex flex-wrap gap-2 justify-center">
        {game.firstReleaseDate && (
          <Badge className="flex items-center gap-1.5 bg-muted px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider text-black">
            <IconCalendar aria-hidden="true" size={12} />
            {new Date(game.firstReleaseDate * 1000).toLocaleDateString()}
          </Badge>
        )}
        <Badge className="flex items-center gap-1.5 bg-muted px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider text-black">
          <IconDeviceGamepad aria-hidden="true" size={12} />
          IGDB ID: {game.igdbId}
        </Badge>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          variant="default"
          className="w-full font-bold h-10 rounded-none cursor-pointer bg-sky-600! hover:bg-sky-700! text-white! hover:text-white! border-none"
          disabled={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
        >
          <IconRefresh
            aria-hidden="true"
            className={cn(
              'mr-2 size-4',
              syncMutation.isPending && 'animate-spin',
            )}
          />
          {syncMutation.isPending ? 'Syncing...' : 'Sync with IGDB'}
        </Button>
        <Button
          variant="destructive"
          className="w-full font-bold h-10 rounded-none cursor-pointer"
          disabled={false}
          onClick={() => onDeleteDialogOpen(true)}
        >
          <IconTrash aria-hidden="true" className="mr-2 size-4" />
          Delete Game
        </Button>
      </div>
    </>
  );
}

function InfoTabContent({ igdbId }: { igdbId: string }) {
  const { data: game } = useSuspenseQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  const platforms = game.platforms as string[] | null;
  const genres = game.genres as string[] | null;
  const involvedCompanies = game.involvedCompanies as Company[] | null;

  return (
    <div className="space-y-10">
      {game.summary && (
        <div className="space-y-4">
          <h2 className="text-md font-black uppercase tracking-widest border-l-4 border-primary pl-4">
            Summary
          </h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {game.summary}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
        {platforms && platforms.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Platforms
            </h3>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p: string) => (
                <span
                  key={p}
                  className="bg-primary/5 text-primary border border-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {genres && genres.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Genres
            </h3>
            <div className="flex flex-wrap gap-2">
              {genres.map((g: string) => (
                <span
                  key={g}
                  className="bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wider border border-border"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {involvedCompanies && involvedCompanies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Companies
          </h3>
          <div className="flex flex-wrap gap-3">
            {involvedCompanies.map((c: Company, idx: number) => (
              <div
                key={`${c.name}-${idx}`}
                className="flex flex-col border border-dashed p-3 min-w-37.5"
              >
                <span className="font-bold text-sm">{c.name}</span>
                <span className="text-[10px] uppercase text-muted-foreground font-bold">
                  {c.developer ? 'Developer' : ''}
                  {c.developer && c.publisher ? ' & ' : ''}
                  {c.publisher ? 'Publisher' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ArtworksTabContent({ igdbId }: { igdbId: string }) {
  const { data: game } = useSuspenseQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  const artworks = game.artworks as ArtworkImage[] | null;

  return (
    <div className="space-y-10">
      {artworks && artworks.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-md font-black uppercase tracking-widest border-l-4 border-primary pl-4 flex items-center gap-2">
            <IconLayersIntersect aria-hidden="true" size={20} />
            Artworks {artworks.length}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {artworks.map((art: ArtworkImage, index: number) => (
              <Dialog key={`${art.image_id}-${index}`}>
                <DialogTrigger
                  nativeButton={false}
                  render={
                    <Card className="overflow-hidden border-2 rounded-none bg-muted/20 group cursor-pointer hover:border-primary/50 transition-colors p-0">
                      <div className="relative aspect-video w-full">
                        <Image
                          src={art.url
                            .replace('t720p', 't1080p')
                            .replace('.jpg', '.png')}
                          alt={`${game.name} artwork ${index + 1}`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 200px"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <IconExternalLink
                            aria-hidden="true"
                            className="text-white opacity-0 group-hover:opacity-100 transition-opacity size-5"
                          />
                        </div>
                      </div>
                    </Card>
                  }
                />
                <DialogContent className="fixed! inset-0! m-auto! translate-x-0! translate-y-0! max-w-4xl w-full aspect-video p-0 overflow-hidden bg-transparent border-none ring-0">
                  <DialogHeader className="sr-only">
                    <DialogTitle>
                      {game.name} Artwork {index + 1}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="relative w-full h-full">
                    <Image
                      src={art.url
                        .replace('t720p', 'toriginal')
                        .replace('.jpg', '.png')}
                      alt={`${game.name} artwork ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(game.imageGen) && game.imageGen.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-md font-black uppercase tracking-widest border-l-4 border-primary pl-4 flex items-center gap-2">
            <IconBrush aria-hidden="true" size={20} />
            Image Gen History ({game.imageGen.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {game.imageGen.map((entry, index) => {
              if (!entry || typeof entry !== 'object') return null;
              const keys = Object.keys(entry);
              if (keys.length === 0) return null;
              const styleKey = keys[0];
              const data = entry[styleKey];
              if (!data || typeof data !== 'object') return null;
              const styleLabel =
                artStyles.find((s) => s.value === styleKey)?.label ?? styleKey;
              return (
                <Dialog key={index}>
                  <DialogTrigger
                    nativeButton={false}
                    render={
                      <div className="group relative aspect-square w-full cursor-pointer overflow-hidden border bg-muted/20 hover:border-primary/50 transition-colors">
                        <Image
                          src={data.url}
                          alt={`${game.name} - ${styleLabel}`}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 200px"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-white text-[10px]">
                          <p className="font-bold truncate">{styleLabel}</p>
                          <p className="opacity-70">{data.provider}</p>
                        </div>
                      </div>
                    }
                  />
                  <DialogContent className="fixed! inset-0! m-auto! translate-x-0! translate-y-0! max-w-2xl w-full aspect-square p-0 overflow-hidden bg-transparent border-none ring-0">
                    <DialogHeader className="sr-only">
                      <DialogTitle>
                        {game.name} - {styleLabel}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-full">
                      <Image
                        src={data.url}
                        alt={`${game.name} - ${styleLabel}`}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 896px) 100vw, 896px"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ImageGenTabContent({
  igdbId,
  artStyle,
  setArtStyle,
  includeStoryline,
  setIncludeStoryline,
  includeGenres,
  setIncludeGenres,
  includeThemes,
  setIncludeThemes,
}: {
  igdbId: string;
  artStyle: ArtStyle;
  setArtStyle: (s: ArtStyle) => void;
  includeStoryline: boolean;
  setIncludeStoryline: (v: boolean) => void;
  includeGenres: boolean;
  setIncludeGenres: (v: boolean) => void;
  includeThemes: boolean;
  setIncludeThemes: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: game } = useSuspenseQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  const generateImageMutation = useMutation({
    mutationFn: () =>
      generateImage(Number.parseInt(igdbId, 10), {
        includeStoryline,
        includeGenres,
        includeThemes,
        artStyle: artStyle,
      }),
    onMutate: () => {
      toast.loading('Generating AI image...', { id: 'generate-image' });
    },
    onSuccess: () => {
      toast.success('AI image generated successfully', {
        id: 'generate-image',
      });
      queryClient.invalidateQueries({ queryKey: ['game', igdbId] });
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to generate AI image', { id: 'generate-image' });
    },
  });

  const generatedImage = useMemo(() => {
    if (!game || !Array.isArray(game.imageGen)) return null;
    const entry = game.imageGen.find(
      (item) => item && typeof item === 'object' && artStyle in item,
    );
    return entry
      ? (entry[artStyle] as { url: string; prompt: string; provider: string })
      : null;
  }, [game, artStyle]);

  const savedPrompt = generatedImage?.prompt;
  const provider = generatedImage?.provider ?? 'N/A';

  const savedPromptRows = useMemo(() => {
    if (!savedPrompt) return 4;
    return Math.min(15, Math.max(4, Math.ceil(savedPrompt.length / 28)));
  }, [savedPrompt]);

  const previewPrompt = useMemo(() => {
    if (!game) return '';
    return buildPromptPreview(game, {
      includeStoryline,
      includeGenres,
      includeThemes,
      artStyle: artStyle,
    });
  }, [game, includeStoryline, includeGenres, includeThemes, artStyle]);

  const previewPromptRows = useMemo(() => {
    if (!previewPrompt) return 4;
    return Math.min(15, Math.max(4, Math.ceil(previewPrompt.length / 50)));
  }, [previewPrompt]);

  const imageGenButtonText = generateImageMutation.isPending
    ? 'Generating...'
    : generatedImage
      ? 'Regenerate AI Image'
      : 'Generate AI Image';
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        {generatedImage ? (
          <Dialog>
            <DialogTrigger className="relative aspect-square w-full overflow-hidden border-2 border-solid border-muted-foreground/30 group cursor-pointer hover:border-primary/50 transition-colors p-0 m-0 bg-transparent block">
              <Image
                src={generatedImage.url}
                alt={`${game.name} AI Image - ${artStyles.find((s) => s.value === artStyle)?.label ?? artStyle}`}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 256px"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <IconExternalLink
                  aria-hidden="true"
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity size-8"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="fixed! inset-0! m-auto! translate-x-0! translate-y-0! max-w-2xl w-full aspect-square p-0 overflow-hidden bg-transparent border-none ring-0">
              <DialogHeader className="sr-only">
                <DialogTitle>
                  {game.name} AI Image -{' '}
                  {artStyles.find((s) => s.value === artStyle)?.label ??
                    artStyle}
                </DialogTitle>
              </DialogHeader>
              <div className="relative w-full h-full">
                <Image
                  src={generatedImage.url}
                  alt={`${game.name} AI Image`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 896px) 100vw, 896px"
                />
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="relative aspect-square w-full flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 bg-muted/5">
            <span className="text-xs uppercase font-black tracking-widest text-muted-foreground/60">
              N/A
            </span>
          </div>
        )}

        {/* Saved Prompt */}
        <div className="flex flex-col gap-2 min-h-32 mt-2">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Saved Prompt
          </h3>
          {savedPrompt ? (
            <Textarea
              readOnly
              value={savedPrompt}
              rows={savedPromptRows}
              className="rounded-none resize-none w-full text-sm text-muted-foreground italic bg-muted/30 border-dashed h-40 lg:h-auto"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center border border-dashed border-muted-foreground/20 bg-muted/5 min-h-32 py-8">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">
                N/A
              </span>
            </div>
          )}
          <span className="text-sm">
            <span className="font-bold">Provider: </span>
            <span className="capitalize">{provider}</span>
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Art Style
          </h3>
          <div className="border border-border bg-card/50 overflow-y-scroll scrollbar-y max-h-60 rounded-none divide-y divide-border">
            {artStyles.map((style) => {
              const isSelected = style.value === artStyle;
              const hasImage =
                Array.isArray(game?.imageGen) &&
                game.imageGen.some(
                  (item) =>
                    item && typeof item === 'object' && style.value in item,
                );
              return (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => setArtStyle(style.value as ArtStyle)}
                  disabled={generateImageMutation.isPending}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'hover:bg-muted text-foreground',
                  )}
                >
                  <span>{style.label}</span>
                  {hasImage && (
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-wider',
                        isSelected
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted-foreground/10 text-muted-foreground',
                      )}
                    >
                      generated
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          Prompt Fields
        </h3>
        <div className="flex flex-col xl:flex-row xl:flex-wrap gap-2.5">
          {(
            [
              { id: 'field-title', label: 'Title', hasValue: !!game.name },
              {
                id: 'field-summary',
                label: 'Summary',
                hasValue: !!game.summary,
              },
              {
                id: 'field-keywords',
                label: 'Keywords',
                hasValue: !!(game.keywords as string[] | null)?.length,
              },
            ] as const
          ).map(({ id, label, hasValue }) => (
            <div key={id} className="flex items-center gap-2.5">
              <Checkbox
                id={id}
                checked={hasValue}
                disabled
                className="data-checked:bg-blue-600 data-checked:border-blue-600"
              />
              <Label
                htmlFor={id}
                className="text-sm font-medium cursor-default text-muted-foreground"
              >
                {label}
              </Label>
            </div>
          ))}

          {(
            [
              {
                id: 'field-storyline',
                label: 'Storyline',
                hasValue: !!game.storyline,
                checked: includeStoryline,
                onCheckedChange: setIncludeStoryline,
              },
              {
                id: 'field-genres',
                label: 'Genres',
                hasValue: !!(game.genres as string[] | null)?.length,
                checked: includeGenres,
                onCheckedChange: setIncludeGenres,
              },
              {
                id: 'field-themes',
                label: 'Themes',
                hasValue: !!(game.themes as string[] | null)?.length,
                checked: includeThemes,
                onCheckedChange: setIncludeThemes,
              },
            ] as const
          ).map(({ id, label, hasValue, checked, onCheckedChange }) => (
            <div key={id} className="flex items-center gap-2.5">
              <Checkbox
                id={id}
                checked={hasValue ? checked : false}
                disabled={!hasValue || generateImageMutation.isPending}
                onCheckedChange={(v) => onCheckedChange(v === true)}
              />
              <Label
                htmlFor={id}
                className={cn(
                  'text-sm font-medium',
                  hasValue
                    ? 'cursor-pointer'
                    : 'cursor-default line-through text-muted-foreground/50',
                )}
              >
                {label}
              </Label>
            </div>
          ))}
        </div>

        {/* Preview Prompt */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Preview Prompt
          </h3>
          <Textarea
            readOnly
            value={previewPrompt}
            rows={previewPromptRows}
            className="rounded-none resize-none w-full text-sm text-muted-foreground italic bg-muted/30 border-dashed h-32 lg:h-auto"
          />
        </div>

        <Button
          variant="outline"
          className={cn(
            'w-full font-bold h-10 rounded-none text-white hover:text-white',
            generateImageMutation.isPending
              ? 'bg-slate-500 hover:bg-slate-500 cursor-not-allowed'
              : 'bg-slate-600 hover:bg-slate-700 cursor-pointer',
          )}
          onClick={() => generateImageMutation.mutate()}
          disabled={generateImageMutation.isPending}
        >
          <IconBrush
            aria-hidden="true"
            className={cn(
              'mr-2 size-4',
              generateImageMutation.isPending && 'animate-pulse',
            )}
          />
          {imageGenButtonText}
        </Button>
      </div>
    </div>
  );
}

function CoverContent({ igdbId }: { igdbId: string }) {
  const { data: game } = useSuspenseQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  if (!game.imageUrl) {
    return (
      <div className="size-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
        No Cover Art
      </div>
    );
  }

  return (
    <>
      <Image
        src={game.imageUrl.replace('t720p', 't1080p').replace('.jpg', '.png')}
        alt={game.name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        priority
        sizes="(max-width: 1024px) 100vw, 320px"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
        <IconExternalLink
          aria-hidden="true"
          className="text-white opacity-0 group-hover:opacity-100 transition-opacity size-8"
        />
      </div>
    </>
  );
}

function HeaderTitle({ igdbId }: { igdbId: string }) {
  const { data: game } = useSuspenseQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  return <>{game.name}</>;
}

export default function GameDetails({
  params,
}: {
  params: Promise<{ igdbId: string }>;
}) {
  const { igdbId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [includeStoryline, setIncludeStoryline] = useState(false);
  const [includeGenres, setIncludeGenres] = useState(false);
  const [includeThemes, setIncludeThemes] = useState(false);
  const [artStyle, setArtStyle] = useState<ArtStyle>(
    DEFAULT_IMAGE_GEN_ART_STYLE,
  );

  // Still needed for the delete dialog — reads from cache after SidebarContent populates it
  const { data: game } = useQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteGame(id),
    onSuccess: () => {
      toast.success('Game deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['games'] });
      router.push('/dashboard');
    },
    onError: (err) => {
      toast.error('Failed to delete game');
      console.error(err);
    },
  });

  if (!isDeleteDialogOpen && game === null) {
    // error / not found state
    return (
      <div className="flex flex-col min-h-full bg-background">
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <DashboardPageHeader title="Game Not Found" icon={IconDashboard} />
          </div>
        </div>
        <div className="container mx-auto px-4 py-10 flex-1">
          <div className="text-center py-20 border border-dashed rounded-none bg-muted/5">
            <h2 className="text-xl font-bold uppercase tracking-tight">
              Game not found
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              The game with IGDB ID <strong>{igdbId}</strong> doesn&apos;t exist
              in our database or there was an error retrieving it.
            </p>
            <Button
              variant="outline"
              className="mt-8 font-black uppercase tracking-widest rounded-none px-8 h-12 cursor-pointer border-2 hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => router.push('/dashboard')}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <DashboardPageHeader
            title={
              <Suspense fallback="Loading...">
                <HeaderTitle igdbId={igdbId} />
              </Suspense>
            }
            icon={IconDashboard}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <div className="w-full max-w-80 mx-auto lg:mx-0 lg:w-80 shrink-0 space-y-6">
            <div className="space-y-4">
              <Dialog>
                <DialogTrigger
                  nativeButton={false}
                  render={
                    <Card className="overflow-hidden border-2 rounded-none shadow-xl cursor-pointer group hover:border-primary/50 transition-colors p-0">
                      <ViewTransition name={`game-details-${igdbId}`}>
                        <div className="relative aspect-3/4 w-full bg-muted">
                          <CoverContent igdbId={igdbId} />
                        </div>
                      </ViewTransition>
                    </Card>
                  }
                />
                {game?.imageUrl && (
                  <DialogContent className="fixed! inset-0! m-auto! translate-x-0! translate-y-0! max-w-md w-full aspect-3/4 p-0 overflow-hidden bg-transparent border-none ring-0">
                    <DialogHeader className="sr-only">
                      <DialogTitle>{game.name} Cover Art</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-full">
                      <Image
                        src={game.imageUrl
                          .replace('t720p', 'toriginal')
                          .replace('.jpg', '.png')}
                        alt={`${game.name} Cover Art`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </DialogContent>
                )}
              </Dialog>

              {/* Badges + Actions suspend together */}
              <Suspense fallback={<SidebarContentSkeleton />}>
                <SidebarContent
                  igdbId={igdbId}
                  onDeleteDialogOpen={setIsDeleteDialogOpen}
                />
              </Suspense>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-6">
            <Tabs defaultValue="info" className="w-full flex flex-col gap-0">
              <TabsList
                variant="line"
                className="mb-8 gap-0 border-b border-border w-full justify-start"
              >
                <TabsTrigger
                  value="info"
                  className="text-xs font-black uppercase tracking-widest px-8 py-3 cursor-pointer hover:text-primary data-active:text-primary data-active:after:bg-primary! data-active:after:opacity-100!"
                >
                  Info
                </TabsTrigger>
                <TabsTrigger
                  value="artworks"
                  className="text-xs font-black uppercase tracking-widest px-8 py-3 cursor-pointer hover:text-primary data-active:text-primary data-active:after:bg-primary! data-active:after:opacity-100!"
                >
                  Artworks
                </TabsTrigger>
                <TabsTrigger
                  value="image-gen"
                  className="text-xs font-black uppercase tracking-widest px-8 py-3 cursor-pointer hover:text-primary data-active:text-primary data-active:after:bg-primary! data-active:after:opacity-100!"
                >
                  Image Gen
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-10 outline-none">
                <Suspense fallback={<InfoTabSkeleton />}>
                  <InfoTabContent igdbId={igdbId} />
                </Suspense>
              </TabsContent>

              <TabsContent value="artworks" className="space-y-10 outline-none">
                <Suspense fallback={<ArtworksTabSkeleton />}>
                  <ArtworksTabContent igdbId={igdbId} />
                </Suspense>
              </TabsContent>

              <TabsContent value="image-gen" className="space-y-6 outline-none">
                <Suspense fallback={<ImageGenTabSkeleton />}>
                  <ImageGenTabContent
                    igdbId={igdbId}
                    artStyle={artStyle}
                    setArtStyle={setArtStyle}
                    includeStoryline={includeStoryline}
                    setIncludeStoryline={setIncludeStoryline}
                    includeGenres={includeGenres}
                    setIncludeGenres={setIncludeGenres}
                    includeThemes={includeThemes}
                    setIncludeThemes={setIncludeThemes}
                  />
                </Suspense>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Delete dialog — lives in root so it survives Suspense boundaries */}
      {game && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent className="rounded-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black uppercase">
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                This action cannot be undone. This will permanently delete{' '}
                <strong>{game.name}</strong> from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-3">
              <AlertDialogCancel
                className="font-bold rounded-none flex-1 cursor-pointer"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(game.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold rounded-none flex-1 cursor-pointer"
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
