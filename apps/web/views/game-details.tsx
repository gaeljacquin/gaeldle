'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGameByIgdbId, deleteGame, syncGame, generateImage, generatePrompt, clearPrompt } from '@/lib/services/game.service';
import BackToDashboard from '@/components/back-to-dashboard';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { IconTrash, IconCalendar, IconDeviceGamepad, IconLayersIntersect, IconExternalLink, IconRefresh, IconBrush, IconSparkles, IconEraser } from '@tabler/icons-react';
import { type ArtworkImage } from '@gaeldle/api-contract';
import { cn } from '@/lib/utils';
import { IMAGE_STYLES, PLACEHOLDER_IMAGE_R2, TEXT_GEN_MODELS } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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
  const [isClearPromptDialogOpen, setIsClearPromptDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(TEXT_GEN_MODELS[0].value);
  const [selectedStyle, setSelectedStyle] = useState(IMAGE_STYLES[0].value);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeStoryline, setIncludeStoryline] = useState(true);

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
    onError: () => {
      toast.error('Failed to sync game info');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteGame(id),
    onSuccess: () => {
      toast.success('Game deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['games'] });
      router.push('/dashboard');
    },
    onError: () => {
      toast.error('Failed to delete game');
    },
  });

  const generatePromptMutation = useMutation({
    mutationFn: () =>
      generatePrompt({
        igdbId: Number.parseInt(igdbId, 10),
        model: selectedModel,
        style: selectedStyle,
        includeSummary,
        includeStoryline,
      }),
    onMutate: () => {
      toast.loading('Generating prompt...', { id: 'generate-prompt' });
    },
    onSuccess: () => {
      toast.success('Prompt generated successfully', { id: 'generate-prompt' });
      queryClient.invalidateQueries({ queryKey: ['game', igdbId] });
    },
    onError: () => {
      toast.error('Failed to generate prompt', { id: 'generate-prompt' });
    },
  });

  const clearPromptMutation = useMutation({
    mutationFn: () => clearPrompt(Number.parseInt(igdbId, 10)),
    onSuccess: () => {
      toast.success('Prompt cleared');
      queryClient.invalidateQueries({ queryKey: ['game', igdbId] });
    },
    onError: () => {
      toast.error('Failed to clear prompt');
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: () => generateImage(Number.parseInt(igdbId, 10), game!.aiPrompt!),
    onMutate: () => {
      toast.loading('Generating AI image...', { id: 'generate-image' });
    },
    onSuccess: () => {
      toast.success('AI image generated successfully', { id: 'generate-image' });
      queryClient.invalidateQueries({ queryKey: ['game', igdbId] });
    },
    onError: () => {
      toast.error('Failed to generate AI image', { id: 'generate-image' });
    },
  });

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
                        src={game.imageUrl}
                        alt={game.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                        sizes="(max-width: 768px) 100vw, 320px"
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
              {/* Left: AI image + Generate AI Image button */}
              <div className="w-full md:w-64 shrink-0 space-y-3">
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
                          <div className="flex flex-col gap-2 items-center justify-center">
                            {game.aiImageUrl === null && <Badge className="text-xs bg-slate-500">Placeholder image</Badge>}
                            <IconExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity size-8" />
                          </div>
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
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full font-bold h-10 rounded-none text-white hover:text-white",
                    generateImageMutation.isPending
                      ? "bg-purple-400 hover:bg-purple-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 cursor-pointer",
                  )}
                  onClick={() => generateImageMutation.mutate()}
                  disabled={generateImageMutation.isPending || !game.aiPrompt}
                >
                  <IconBrush className={cn(
                    "mr-2 size-4",
                    generateImageMutation.isPending && "animate-pulse"
                  )} />
                  {generateImageMutation.isPending ? 'Generating...' : 'Generate AI Image'}
                </Button>
              </div>

              {/* Right: Prompt display + Generate Prompt form */}
              <div className="flex-1 space-y-4">
                {game.aiPrompt && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">AI Prompt</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                        onClick={() => setIsClearPromptDialogOpen(true)}
                        disabled={clearPromptMutation.isPending}
                      >
                        <IconEraser className="size-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                    <div className="bg-muted/30 border border-dashed p-4 rounded-none">
                      <p className="text-sm italic text-muted-foreground leading-relaxed">
                        &quot;{game.aiPrompt}&quot;
                      </p>
                    </div>
                  </div>
                )}

                <AlertDialog open={isClearPromptDialogOpen} onOpenChange={setIsClearPromptDialogOpen}>
                  <AlertDialogContent className="rounded-none">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl font-black uppercase">Clear prompt?</AlertDialogTitle>
                      <AlertDialogDescription className="text-base">
                        This will remove the saved AI prompt for <strong>{game.name}</strong>. The generated image will not be affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-3">
                      <AlertDialogCancel className="font-bold rounded-none flex-1 cursor-pointer" onClick={() => setIsClearPromptDialogOpen(false)}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          setIsClearPromptDialogOpen(false);
                          clearPromptMutation.mutate();
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold rounded-none flex-1 cursor-pointer"
                      >
                        Clear Prompt
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="border border-dashed p-4 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Generate Prompt</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model</Label>
                      <Select
                        value={selectedModel}
                        onValueChange={(val) => { if (val) setSelectedModel(val); }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEXT_GEN_MODELS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Style</Label>
                      <Select
                        value={selectedStyle}
                        onValueChange={(val) => { if (val) setSelectedStyle(val); }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {IMAGE_STYLES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <label className={cn(
                      "flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
                      game.summary ? "cursor-pointer" : "opacity-40 cursor-not-allowed",
                    )}>
                      <Input
                        type="checkbox"
                        checked={includeSummary && !!game.summary}
                        onChange={(e) => setIncludeSummary(e.target.checked)}
                        disabled={!game.summary}
                        className="size-3.5 accent-primary"
                      />
                      Include Summary
                    </label>

                    <label className={cn(
                      "flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
                      game.storyline ? "cursor-pointer" : "opacity-40 cursor-not-allowed",
                    )}>
                      <Input
                        type="checkbox"
                        checked={includeStoryline && !!game.storyline}
                        onChange={(e) => setIncludeStoryline(e.target.checked)}
                        disabled={!game.storyline}
                        className="size-3.5 accent-primary"
                      />
                      Include Storyline
                    </label>
                  </div>

                  <Button
                    variant="outline"
                    className={cn(
                      "w-full font-bold h-10 rounded-none text-white hover:text-white",
                      generatePromptMutation.isPending
                        ? "bg-indigo-400 hover:bg-indigo-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer",
                    )}
                    onClick={() => generatePromptMutation.mutate()}
                    disabled={generatePromptMutation.isPending}
                  >
                    <IconSparkles className={cn(
                      "mr-2 size-4",
                      generatePromptMutation.isPending && "animate-pulse"
                    )} />
                    {generatePromptMutation.isPending ? 'Generating...' : 'Generate Prompt'}
                  </Button>
                </div>
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
