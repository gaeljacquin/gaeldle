'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  DEFAULT_PROVIDER,
  IMAGE_PROMPT_SUFFIX,
  MIN_PREVIEW_PROMPT_ROWS,
} from '@workspace/shared';
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { getGameByIgdbId, generateImage } from '@/lib/services/game.service';
import Image from 'next/image';
import { Button } from '@workspace/ui/button';
import { Textarea } from '@workspace/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/dialog';
import { toast } from 'sonner';
import { IconExternalLink, IconBrush } from '@tabler/icons-react';
import { Game, type ArtStyleValue } from '@workspace/api-contract';
import { cn } from '@workspace/ui/lib/utils';
import { Checkbox } from '@workspace/ui/checkbox';
import { Label } from '@workspace/ui/label';
import { artStylesQueryOptions } from '@/lib/services/art-style.service';
import type { ArtStyle } from '@workspace/api-contract';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/select';

const generateImageToastId = 'generate-image';

function buildPromptPreview(
  game: Game,
  artStyles: ArtStyle[],
  options: {
    includeStoryline: boolean;
    includeGenres: boolean;
    includeThemes: boolean;
    artStyleValue: string;
  },
): string {
  const parts: string[] = [];
  const style =
    artStyles.find((s) => s.value === options.artStyleValue) ?? artStyles[0];

  parts.push(
    `${style.description} of iconic characters from "${game.name}" set within the game's distinct world`,
  );

  if (game.summary) {
    parts.push(game.summary);
  }

  if (options.includeStoryline && game.storyline) {
    parts.push(game.storyline);
  }

  const genres = game.genres as string[] | null;

  if (options.includeGenres && genres?.length) {
    parts.push(`Genres: ${genres.join(', ')}`);
  }

  const themes = game.themes as string[] | null;

  if (options.includeThemes && themes?.length) {
    parts.push(`Themes: ${themes.join(', ')}`);
  }

  const keywords = game.keywords as string[] | null;

  if (keywords?.length) {
    parts.push(`Keywords: ${keywords.join(', ')}`);
  }

  parts.push(IMAGE_PROMPT_SUFFIX);

  return parts.join('. ');
}

export default function GameDetailsImageGenTab({
  igdbId,
  artStyleValue,
  setArtStyleValue,
  includeStoryline,
  setIncludeStoryline,
  includeGenres,
  setIncludeGenres,
  includeThemes,
  setIncludeThemes,
}: {
  igdbId: string;
  artStyleValue: ArtStyleValue;
  setArtStyleValue: (s: ArtStyleValue) => void;
  includeStoryline: boolean;
  setIncludeStoryline: (v: boolean) => void;
  includeGenres: boolean;
  setIncludeGenres: (v: boolean) => void;
  includeThemes: boolean;
  setIncludeThemes: (v: boolean) => void;
}) {
  const [isPolling, setIsPolling] = useState(false);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [providerVal, setProviderVal] = useState<string>(DEFAULT_PROVIDER);

  const queryClient = useQueryClient();
  const { data: game } = useSuspenseQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
    refetchInterval: isPolling ? 2000 : false,
  });

  const { data: artStyles } = useSuspenseQuery(artStylesQueryOptions);

  const generatedImage = useMemo(() => {
    if (!game || !Array.isArray(game.imageGen)) {
      return null;
    }

    const entry = game.imageGen.find(
      (item) => item && typeof item === 'object' && artStyleValue in item,
    );

    return entry
      ? (entry[artStyleValue] as {
          url: string;
          prompt: string;
          provider: string;
        })
      : null;
  }, [game, artStyleValue]);

  const generateImageMutation = useMutation({
    mutationFn: () =>
      generateImage(Number.parseInt(igdbId, 10), {
        includeStoryline,
        includeGenres,
        includeThemes,
        artStyleValue,
        provider: providerVal,
      }),
    onMutate: () => {
      toast.loading('Generating image...', { id: generateImageToastId });
      setPrevUrl(generatedImage?.url ?? null);
    },
    onSuccess: () => {
      toast.info('Image generation queued! It will appear in one moment.', {
        id: generateImageToastId,
        duration: Infinity,
      });
      setIsPolling(true);
      queryClient.invalidateQueries({ queryKey: ['game', igdbId] });
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to generate image', { id: generateImageToastId });
    },
  });

  useEffect(() => {
    if (isPolling) {
      const currentUrl = generatedImage?.url ?? null;

      if (currentUrl && currentUrl !== prevUrl) {
        setTimeout(() => {
          setIsPolling(false);
        }, 0);
        toast.success('Image generated successfully!', {
          id: generateImageToastId,
        });
      }
    }
  }, [generatedImage?.url, isPolling, prevUrl]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isPolling) {
      timeoutId = setTimeout(() => {
        setIsPolling(false);
        toast.error('Image generation timed out. Please check again later.', {
          id: generateImageToastId,
        });
      }, 60000);
    }

    return () => clearTimeout(timeoutId);
  }, [isPolling]);

  const savedPrompt = generatedImage?.prompt;
  const provider = generatedImage?.provider ?? 'N/A';
  const artStyleLabel = artStyles.find((s) => s.value === artStyleValue)?.label;

  const savedPromptRows = useMemo(() => {
    if (!savedPrompt) {
      return MIN_PREVIEW_PROMPT_ROWS;
    }

    return Math.min(
      15,
      Math.max(MIN_PREVIEW_PROMPT_ROWS, Math.ceil(savedPrompt.length / 28)),
    );
  }, [savedPrompt]);

  const previewPrompt = useMemo(() => {
    if (!game) {
      return '';
    }

    return buildPromptPreview(game, artStyles, {
      includeStoryline,
      includeGenres,
      includeThemes,
      artStyleValue,
    });
  }, [
    game,
    artStyles,
    includeStoryline,
    includeGenres,
    includeThemes,
    artStyleValue,
  ]);

  const previewPromptRows = useMemo(() => {
    if (!previewPrompt) {
      return MIN_PREVIEW_PROMPT_ROWS;
    }

    return Math.min(
      15,
      Math.max(MIN_PREVIEW_PROMPT_ROWS, Math.ceil(previewPrompt.length / 50)),
    );
  }, [previewPrompt]);

  const imageGenButtonText =
    generateImageMutation.isPending || isPolling
      ? 'Generating...'
      : generatedImage
        ? 'Regenerate Image'
        : 'Generate Image';

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        {generatedImage ? (
          <Dialog>
            <DialogTrigger className="relative aspect-square w-full overflow-hidden border-2 border-solid border-muted-foreground/30 group cursor-pointer hover:border-primary/50 transition-colors p-0 m-0 bg-transparent block">
              <Image
                src={generatedImage.url}
                alt={`${game.name} Image Gen - ${artStyleLabel}`}
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
                  {game.name} Image Gen -{' '}
                  {artStyles.find((s) => s.value === artStyleValue)?.label ??
                    artStyleValue}
                </DialogTitle>
              </DialogHeader>
              <div className="relative w-full h-full">
                <Image
                  src={generatedImage.url}
                  alt={`${game.name} Image Gen`}
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
              const isSelected = style.value === artStyleValue;
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
                  onClick={() => setArtStyleValue(style.value as ArtStyleValue)}
                  disabled={generateImageMutation.isPending || isPolling}
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

        <div className="space-y-1.5">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Model / Provider
          </h3>
          <Select
            value={providerVal}
            onValueChange={(val) => val && setProviderVal(val)}
            disabled={generateImageMutation.isPending || isPolling}
          >
            <SelectTrigger className="w-full h-10 rounded-none bg-card/50 border-border text-sm flex">
              <SelectValue placeholder="Select provider">
                {(value) =>
                  value === 'cloudflare'
                    ? 'Cloudflare Workers AI'
                    : value === 'stable-image-core'
                      ? 'Stable Image Core'
                      : ''
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border border-border bg-popover rounded-none">
              <SelectItem value="cloudflare" className="text-sm">
                Cloudflare Workers AI
              </SelectItem>
              <SelectItem
                value="stable-image-core"
                disabled
                className="text-sm"
              >
                Stable Image Core
              </SelectItem>
            </SelectContent>
          </Select>
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
                disabled={
                  !hasValue || generateImageMutation.isPending || isPolling
                }
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
            generateImageMutation.isPending || isPolling
              ? 'bg-slate-500 hover:bg-slate-500 cursor-not-allowed'
              : 'bg-slate-600 hover:bg-slate-700 cursor-pointer',
          )}
          onClick={() => generateImageMutation.mutate()}
          disabled={generateImageMutation.isPending || isPolling}
        >
          <IconBrush
            aria-hidden="true"
            className={cn(
              'mr-2 size-4',
              (generateImageMutation.isPending || isPolling) && 'animate-pulse',
            )}
          />
          {imageGenButtonText}
        </Button>
      </div>
    </div>
  );
}
