'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGameByIgdbId, deleteGame } from '@/lib/services/game.service';
import BackToDashboard from '@/components/back-to-dashboard';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { IconTrash, IconCalendar, IconDeviceGamepad, IconLayersIntersect, IconExternalLink } from '@tabler/icons-react';
import { type ArtworkImage } from '@gaeldle/api-contract';

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

  const { data: game, isLoading, error } = useQuery({
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
          <Card className="overflow-hidden border-2 rounded-none shadow-xl">
            <div className="relative aspect-3/4 w-full">
              {game.imageUrl ? (
                <Image
                  src={game.imageUrl}
                  alt={game.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                  No Cover Art
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-3 pt-2">
            {info?.url && (
              <Button variant="outline" className="w-full font-bold h-10 rounded-none" onClick={() => window.open(info.url, '_blank')}>
                <IconExternalLink className="mr-2 size-4" />
                View on IGDB
              </Button>
            )}

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
                  {new Date(game.firstReleaseDate * 1000).getFullYear()}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {artworks.map((art: ArtworkImage, index: number) => (
                  <Card key={art.image_id || index} className="overflow-hidden border-2 rounded-none bg-muted/20 group">
                    <div className="relative aspect-video w-full">
                      <Image
                        src={art.url}
                        alt={`${game.name} artwork ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

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
