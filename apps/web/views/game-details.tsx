'use client';

import { use, useState, Suspense, ViewTransition } from 'react';
import {
  useQuery,
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { getGameByIgdbId, deleteGame } from '@/lib/services/game.service';
import { DashboardHeader } from '@/components/dashboard-header';
import Image from 'next/image';
import { Button } from '@workspace/ui/button';
import { Card } from '@workspace/ui/card';
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
import { IconDeviceGamepad2 } from '@tabler/icons-react';
import { type ArtStyleValue } from '@workspace/api-contract';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/tabs';
import { artStylesQueryOptions } from '@/lib/services/art-style.service';
import {
  SidebarContentSkeleton,
  InfoTabSkeleton,
  ArtworksTabSkeleton,
  ImageGenTabSkeleton,
} from '@/components/game-details-tab-skeleton';
import GameDetailsSidebar from '@/components/game-details-sidebar';
import GameDetailsInfoTab from '@/components/game-details-info-tab';
import GameDetailsImageGenTab from '@/components/game-details-image-gen-tab';
import GameDetailsCover from '@/components/game-details-cover';
import GameDetailsHeaderTitle from '@/components/game-details-header-title';
import GameDetailsArtworksTab from '@/components/game-details-artworks-tab';
import GameDetailsInfoGenTab from '@/components/game-details-info-gen';

export default function GameDetails({
  params,
}: {
  params: Promise<{ igdbId: string }>;
}) {
  const { igdbId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: artStyles } = useSuspenseQuery(artStylesQueryOptions);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [includeStoryline, setIncludeStoryline] = useState(false);
  const [includeGenres, setIncludeGenres] = useState(false);
  const [includeThemes, setIncludeThemes] = useState(false);
  const [artStyleValue, setArtStyleValue] = useState<ArtStyleValue>(
    () => (artStyles.find((s) => s.isDefault === 1) ?? artStyles[0]).value,
  );

  // Still needed for the delete dialog — reads from cache after GameDetailsSidebar populates it
  const { data: game } = useQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteGame(id),
    onSuccess: () => {
      toast.success('Game deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['games'] });
      const search =
        typeof window !== 'undefined' ? window.location.search : '';
      router.push(`/dashboard${search}`);
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
        <DashboardHeader
          title="Game Not Found"
          icon={IconDeviceGamepad2}
          dashboardBacklinkProps={{ text: 'Dashboard', href: '/dashboard' }}
        />
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
              onClick={() => {
                const search =
                  typeof window !== 'undefined' ? window.location.search : '';
                router.push(`/dashboard${search}`);
              }}
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
      <DashboardHeader
        title={
          <Suspense fallback="Loading...">
            <GameDetailsHeaderTitle igdbId={igdbId} />
          </Suspense>
        }
        icon={IconDeviceGamepad2}
        dashboardBacklinkProps={{ text: 'Dashboard', href: '/dashboard' }}
      />

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
                          <GameDetailsCover igdbId={igdbId} />
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
                <GameDetailsSidebar
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
                <TabsTrigger value="info" className="game-details-tab">
                  Info
                </TabsTrigger>
                <TabsTrigger value="artworks" className="game-details-tab">
                  Artworks
                </TabsTrigger>
                <TabsTrigger value="image-gen" className="game-details-tab">
                  Image Gen
                </TabsTrigger>
                <TabsTrigger value="info-gen" className="game-details-tab">
                  Info Gen
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-10 outline-none">
                <Suspense fallback={<InfoTabSkeleton />}>
                  <GameDetailsInfoTab igdbId={igdbId} />
                </Suspense>
              </TabsContent>

              <TabsContent value="artworks" className="space-y-10 outline-none">
                <Suspense fallback={<ArtworksTabSkeleton />}>
                  <GameDetailsArtworksTab igdbId={igdbId} />
                </Suspense>
              </TabsContent>

              <TabsContent value="image-gen" className="space-y-6 outline-none">
                <Suspense fallback={<ImageGenTabSkeleton />}>
                  {artStyleValue !== '' && (
                    <GameDetailsImageGenTab
                      igdbId={igdbId}
                      artStyleValue={artStyleValue}
                      setArtStyleValue={setArtStyleValue}
                      includeStoryline={includeStoryline}
                      setIncludeStoryline={setIncludeStoryline}
                      includeGenres={includeGenres}
                      setIncludeGenres={setIncludeGenres}
                      includeThemes={includeThemes}
                      setIncludeThemes={setIncludeThemes}
                    />
                  )}
                </Suspense>
              </TabsContent>

              <TabsContent value="info-gen" className="space-y-10 outline-none">
                <Suspense fallback={<ArtworksTabSkeleton />}>
                  <GameDetailsInfoGenTab igdbId={igdbId} />
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
