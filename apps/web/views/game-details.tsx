'use client';

import { use, useState } from 'react';
import { IMAGE_PROMPT_SUFFIX } from '@gaeldle/constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGameByIgdbId, deleteGame, syncGame, generateImage } from '@/lib/services/game.service';
import BackToDashboard from '@/components/back-to-dashboard';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { IconTrash, IconCalendar, IconDeviceGamepad, IconLayersIntersect, IconExternalLink, IconRefresh, IconBrush } from '@tabler/icons-react';
import { Game, type ArtworkImage } from '@gaeldle/api-contract';
import { cn } from '@/lib/utils';
import { PLACEHOLDER_IMAGE_R2 } from '@/lib/constants';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

function buildPromptPreview(
  game: Game,
  options: { includeStoryline: boolean; includeGenres: boolean; includeThemes: boolean },
): string {
  const parts: string[] = [];

  parts.push(`Cinematic video game key art for "${game.name}"`);

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

  parts.push(
    IMAGE_PROMPT_SUFFIX,
  );

  return parts.join('. ');
}

interface Company {
  name: string;
  developer: boolean;
  publisher: boolean;
}

interface Info {
  url?: string;
  rating?: number;
  ratingCount?: number;
}

export default function GameDetails({ params }: Readonly<{ params: Promise<{ igdbId: string }> }>) {
  const { igdbId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [includeStoryline, setIncludeStoryline] = useState(false);
  const [includeGenres, setIncludeGenres] = useState(false);
  const [includeThemes, setIncludeThemes] = useState(false);
  const [promptView, setPromptView] = useState<'preview' | 'saved'>('preview');

  const { data: game, isLoading, error } = useQuery({
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

  const generateImageMutation = useMutation({
    mutationFn: () =>
      generateImage(Number.parseInt(igdbId, 10), {
        includeStoryline,
        includeGenres,
        includeThemes,
      }),
    onMutate: () => {
      toast.loading('Generating AI image...', { id: 'generate-image' });
    },
    onSuccess: () => {
      toast.success('AI image generated successfully', { id: 'generate-image' });
      queryClient.invalidateQueries({ queryKey: ['game', igdbId] });
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to generate AI image', { id: 'generate-image' });
    },
  });

  const buttonText = (game: Game) => {
    if (generateImageMutation.isPending) {
      return  'Generating...';
    }

    if(game?.aiImageUrl) {
      return 'Regenerate AI Image';
    }

    return 'Generate AI Image';
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="mt-4 text-muted-foreground">Loading game details...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container mx-auto px-4 py-10">
        <BackToDashboard />
        <div className="text-center py-20 border border-dashed rounded-none bg-muted/5">
          <h2 className="text-xl font-bold">Game not found</h2>
          <p className="text-muted-foreground mt-2">The game you&apos;re looking for doesn&apos;t exist in our database.</p>
          <Button
             variant="outline"
             className="mt-6 font-bold cursor-pointer"
             onClick={() => router.push('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Cast to specific types for the nested properties that are stored as json in DB
  const artworks = game.artworks as ArtworkImage[] | null;
  const platforms = game.platforms as string[] | null;
  const genres = game.genres as string[] | null;
  const involvedCompanies = game.involvedCompanies as Company[] | null;
  const info = game.info as Info | null;

  return (
    <div className="container mx-auto px-4 py-10 min-h-screen">
      <BackToDashboard />

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar: Cover Art & Actions */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <Dialog>
            <DialogTrigger nativeButton={false} render={<Card className="overflow-hidden border-2 rounded-none shadow-xl cursor-pointer group hover:border-primary/50 transition-colors" />}>
                <div className="relative aspect-3/4 w-full">
                  {game.imageUrl ? (
                    <>
                      <Image
                        src={game.imageUrl.replace('t_720p', 't_1080p')}
                        alt={game.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                        sizes="(max-width: 1024px) 100vw, 320px"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <IconExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity size-8" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      No Cover Art
                    </div>
                  )}
                </div>
            </DialogTrigger>
            {game.imageUrl && (
              <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none ring-0 sm:max-w-4xl">
                <DialogHeader className="sr-only">
                  <DialogTitle>{game.name} Cover Art</DialogTitle>
                </DialogHeader>
                <div className="relative w-full h-[85vh]">
                  <Image
                    src={game.imageUrl.replace('t_720p', 't_original')}
                    alt={game.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </DialogContent>
            )}
          </Dialog>

          <div className="space-y-3 pt-2">
            <Button
              variant="outline"
              className={cn(
                "w-full font-bold h-10 rounded-none bg-primary/90 hover:bg-primary text-white hover:text-white",
                info?.url ? 'cursor-pointer' : 'cursor-not-allowed',
              )}
              onClick={() => window.open(info?.url, '_blank')}
              disabled={!info?.url}
            >
              <IconExternalLink className="mr-2 size-4" />
              View on IGDB
            </Button>

            <Button
              variant="outline"
              className="w-full font-bold h-10 rounded-none cursor-pointer bg-sky-400 hover:bg-sky-500 text-white hover:text-white"
              disabled={syncMutation.isPending}
              onClick={() => syncMutation.mutate()}
            >
              <IconRefresh className={cn("mr-2 size-4", syncMutation.isPending && "animate-spin")} />
              {syncMutation.isPending ? 'Syncing...' : 'Sync with IGDB'}
            </Button>

            <Button
              variant="destructive"
              className="w-full font-bold h-10 rounded-none cursor-pointer"
              disabled={deleteMutation.isPending}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <IconTrash className="mr-2 size-4" />
              Delete Game
            </Button>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent className="rounded-none">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black uppercase">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    This action cannot be undone. This will permanently delete <strong>{game.name}</strong> from the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 gap-3">
                  <AlertDialogCancel className="font-bold rounded-none flex-1 cursor-pointer" onClick={() => setIsDeleteDialogOpen(false)}>
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
          </div>
        </div>

        {/* Main Content: Info & Artworks */}
        <div className="flex-1 space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-tight">{game.name}</h1>
            <div className="flex flex-wrap gap-3 text-muted-foreground">
              {game.firstReleaseDate && (
                <div className="flex items-center gap-1.5 bg-muted px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider">
                  <IconCalendar size={14} />
                  {new Date(game.firstReleaseDate * 1000).toLocaleDateString()}
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-muted px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider">
                <IconDeviceGamepad size={14} />
                IGDB ID: {game.igdbId}
              </div>
            </div>
          </div>

          {game.summary && (
            <div className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-widest border-l-4 border-primary pl-4">Summary</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {game.summary}
              </p>
            </div>
          )}

          {artworks && artworks.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-black uppercase tracking-widest border-l-4 border-primary pl-4 flex items-center gap-2">
                <IconLayersIntersect size={20} />
                Artworks ({artworks.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {artworks.map((art: ArtworkImage, index: number) => (
                  <Dialog key={art.image_id || index}>
                    <DialogTrigger nativeButton={false} render={<Card className="overflow-hidden border-2 rounded-none bg-muted/20 group cursor-pointer hover:border-primary/50 transition-colors" />}>
                        <div className="relative aspect-video w-full">
                          <Image
                            src={art.url.replace('t_720p', 't_cover_big')}
                            alt={`${game.name} artwork ${index + 1}`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 200px"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <IconExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity size-5" />
                          </div>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl p-0 overflow-hidden bg-transparent border-none ring-0 sm:max-w-6xl">
                      <DialogHeader className="sr-only">
                        <DialogTitle>{game.name} Artwork {index + 1}</DialogTitle>
                      </DialogHeader>
                      <div className="relative w-full h-[85vh]">
                        <Image
                          src={art.url.replace('t_720p', 't_original')}
                          alt={`${game.name} artwork ${index + 1}`}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-lg font-black uppercase tracking-widest border-l-4 border-primary pl-4 flex items-center gap-2">
              <IconBrush size={20} />
              Image Gen
            </h2>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-64 shrink-0">
                <Dialog>
                  <DialogTrigger nativeButton={false} render={<Card className="overflow-hidden border-2 rounded-none bg-muted/20 group cursor-pointer hover:border-primary/50 transition-colors" />}>
                      <div className="relative aspect-square w-full">
                        <Image
                          src={game.aiImageUrl || PLACEHOLDER_IMAGE_R2}
                          alt={`${game.name} AI Image`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, 256px"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <IconExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity size-8" />
                        </div>
                      </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none ring-0 sm:max-w-4xl">
                    <DialogHeader className="sr-only">
                      <DialogTitle>{game.name} AI Image</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-[85vh]">
                      <Image
                        src={game.aiImageUrl || PLACEHOLDER_IMAGE_R2}
                        alt={`${game.name} AI Image`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                {game.aiImageUrl === null && <p className='text-xs text-center'>Placeholder image</p>}
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Prompt Fields</h3>
                <div className="space-y-2.5">
                  {/* Fixed fields */}
                  {(
                    [
                      { id: 'field-title', label: 'Title', hasValue: !!game.name },
                      { id: 'field-summary', label: 'Summary', hasValue: !!game.summary },
                      { id: 'field-keywords', label: 'Keywords', hasValue: !!(game.keywords as string[] | null)?.length },
                    ] as const
                  ).map(({ id, label, hasValue }) => (
                    <div key={id} className="flex items-center gap-2.5">
                      <Checkbox id={id} checked={hasValue} disabled />
                      <Label
                        htmlFor={id}
                        className="text-sm font-medium cursor-default text-muted-foreground"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}

                  {/* Optional fields */}
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
                          "text-sm font-medium",
                          hasValue ? "cursor-pointer" : "cursor-default line-through text-muted-foreground/50",
                        )}
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <Textarea
                    readOnly
                    value={
                      promptView === 'saved' && game.aiPrompt
                        ? game.aiPrompt
                        : buildPromptPreview(game, { includeStoryline, includeGenres, includeThemes })
                    }
                    className="rounded-none resize-none min-h-30 text-sm text-muted-foreground italic bg-muted/30 border-dashed"
                  />
                  {game.aiPrompt && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setPromptView(promptView === 'preview' ? 'saved' : 'preview')}
                        className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline-offset-2 hover:underline cursor-pointer"
                      >
                        {promptView === 'preview' ? 'View saved prompt' : 'View preview'}
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className={cn(
                    "w-full font-bold h-10 rounded-none text-white hover:text-white",
                    generateImageMutation.isPending
                      ? "bg-purple-400 hover:bg-purple-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 cursor-pointer",
                  )}
                  onClick={() => generateImageMutation.mutate()}
                  disabled={generateImageMutation.isPending}
                >
                  <IconBrush className={cn(
                    "mr-2 size-4",
                    generateImageMutation.isPending && "animate-pulse"
                  )} />
                  {buttonText(game)}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
            {platforms && platforms.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((p: string) => (
                    <span key={p} className="bg-primary/5 text-primary border border-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {genres && genres.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {genres.map((g: string) => (
                    <span key={g} className="bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wider border border-border">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {involvedCompanies && involvedCompanies.length > 0 && (
             <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Companies</h3>
                <div className="flex flex-wrap gap-3">
                  {involvedCompanies.map((c: Company, idx: number) => (
                    <div key={`${c.name}-${idx}`} className="flex flex-col border border-dashed p-3 min-w-37.5">
                       <span className="font-bold text-sm">{c.name}</span>
                       <span className="text-[10px] uppercase text-muted-foreground font-bold">
                         {c.developer ? 'Developer' : ''} {c.developer && c.publisher ? '& ' : ''} {c.publisher ? 'Publisher' : ''}
                       </span>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
