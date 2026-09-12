'use client';

import { useState } from 'react';
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getGameByIgdbId,
  syncGame,
  updateGameHidden,
  updateGameWishlist,
  type WishlistKey,
} from '@/lib/services/game.service';
import { Button } from '@workspace/ui/button';
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
import { toast } from 'sonner';
import {
  IconTrash,
  IconRefresh,
  IconCalendar,
  IconDeviceGamepad,
  IconEye,
  IconEyeOff,
  IconHeartOff,
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@/components/badge';
import type { Game } from '@workspace/db';

interface WishlistConfig {
  key: WishlistKey;
  name: string;
  queryKeys: string[];
}

const WISHLISTS: WishlistConfig[] = [
  {
    key: 'steamWishlist',
    name: 'Steam',
    queryKeys: ['steamWishlistGames'],
  },
  {
    key: 'epicWishlist',
    name: 'Epic',
    queryKeys: ['epicWishlistGames', 'wishlist-epic'],
  },
  {
    key: 'nintendoWishlist',
    name: 'Nintendo',
    queryKeys: ['nintendoWishlistGames'],
  },
  {
    key: 'xboxWishlist',
    name: 'XBOX',
    queryKeys: ['wishlist-xbox', 'wishlist-xbox-games'],
  },
  {
    key: 'humbleBundleWishlist',
    name: 'Humble Bundle',
    queryKeys: ['wishlist-humble-bundle'],
  },
];

export default function GameDetailsSidebar({
  igdbId,
  onDeleteDialogOpen,
}: {
  igdbId: string;
  onDeleteDialogOpen: (open: boolean) => void;
}) {
  const [isHideDialogOpen, setIsHideDialogOpen] = useState(false);
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

  const setHiddenMutation = useMutation({
    mutationFn: (hidden: boolean) => updateGameHidden(game.id, hidden),
    onSuccess: (_, hidden) => {
      toast.success(
        hidden
          ? 'Game set as hidden successfully'
          : 'Game unset as hidden successfully',
      );
      queryClient.invalidateQueries({ queryKey: ['game', igdbId] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
      setIsHideDialogOpen(false);
    },
    onError: (err, hidden) => {
      toast.error(
        hidden
          ? 'Failed to set game as hidden'
          : 'Failed to unset game as hidden',
      );
      console.error(err);
    },
  });

  const isHidden = Boolean(game.hidden);

  const [initialWishlistKeys] = useState<WishlistKey[]>(() =>
    WISHLISTS.filter((w) => Boolean(game[w.key])).map((w) => w.key),
  );
  const [removedWishlists, setRemovedWishlists] = useState<Set<WishlistKey>>(
    () => new Set(),
  );
  const [activeWishlistToRemove, setActiveWishlistToRemove] =
    useState<WishlistConfig | null>(null);

  const removeWishlistMutation = useMutation({
    mutationFn: (wishlist: WishlistConfig) =>
      updateGameWishlist(game.id, wishlist.key, false),
    onSuccess: (_, wishlist) => {
      toast.success(`Removed from ${wishlist.name} wishlist`);
      setRemovedWishlists((prev) => new Set(prev).add(wishlist.key));
      setActiveWishlistToRemove(null);
      for (const qk of wishlist.queryKeys) {
        queryClient.invalidateQueries({ queryKey: [qk] });
      }
      queryClient.invalidateQueries({
        queryKey: ['wishlist-last-updated', wishlist.key],
      });
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.setQueryData(
        ['game', igdbId],
        (oldGame: Game | undefined) => {
          if (!oldGame) return oldGame;
          return {
            ...oldGame,
            [wishlist.key]: false,
          };
        },
      );
    },
    onError: (err, wishlist) => {
      toast.error(`Failed to remove from ${wishlist.name} wishlist`);
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

        <AlertDialog open={isHideDialogOpen} onOpenChange={setIsHideDialogOpen}>
          <Button
            variant="outline"
            className={cn(
              'w-full font-bold h-10 rounded-none',
              setHiddenMutation.isPending
                ? 'cursor-not-allowed opacity-70'
                : 'cursor-pointer',
            )}
            disabled={setHiddenMutation.isPending}
            onClick={() => setIsHideDialogOpen(true)}
          >
            {setHiddenMutation.isPending ? (
              <IconRefresh
                aria-hidden="true"
                className="mr-2 size-4 animate-spin"
              />
            ) : isHidden ? (
              <IconEye aria-hidden="true" className="mr-2 size-4" />
            ) : (
              <IconEyeOff aria-hidden="true" className="mr-2 size-4" />
            )}
            {setHiddenMutation.isPending
              ? isHidden
                ? 'Unsetting...'
                : 'Setting...'
              : isHidden
                ? 'Unset as hidden'
                : 'Set as hidden'}
          </Button>
          <AlertDialogContent className="rounded-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black uppercase">
                {isHidden ? 'Unset game as hidden?' : 'Set game as hidden?'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                {isHidden
                  ? `Are you sure you want to unset "${game.name}" as hidden? It will be visible in game modes again.`
                  : `Are you sure you want to set "${game.name}" as hidden? It will be hidden from game modes.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-3">
              <AlertDialogCancel
                className="font-bold rounded-none flex-1 cursor-pointer"
                onClick={() => setIsHideDialogOpen(false)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setIsHideDialogOpen(false);
                  setHiddenMutation.mutate(!isHidden);
                }}
                className="font-bold rounded-none flex-1 cursor-pointer"
              >
                {isHidden ? 'Unset as hidden' : 'Set as hidden'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          variant="destructive"
          className="w-full font-bold h-10 rounded-none cursor-pointer"
          disabled={false}
          onClick={() => onDeleteDialogOpen(true)}
        >
          <IconTrash aria-hidden="true" className="mr-2 size-4" />
          Delete Game
        </Button>

        {initialWishlistKeys.map((key) => {
          const wishlist = WISHLISTS.find((w) => w.key === key)!;
          const isRemoved = removedWishlists.has(key) || !game[key];
          const isPending =
            removeWishlistMutation.isPending &&
            removeWishlistMutation.variables?.key === key;

          return (
            <Button
              key={key}
              variant="outline"
              className={cn(
                'w-full font-bold h-10 rounded-none',
                isRemoved || isPending
                  ? 'cursor-not-allowed opacity-70'
                  : 'cursor-pointer',
              )}
              disabled={isRemoved || isPending}
              onClick={() => setActiveWishlistToRemove(wishlist)}
            >
              {isPending ? (
                <IconRefresh
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              ) : (
                <IconHeartOff aria-hidden="true" className="mr-2 size-4" />
              )}
              {isPending
                ? 'Removing...'
                : `Remove from ${wishlist.name} wishlist`}
            </Button>
          );
        })}

        {activeWishlistToRemove && (
          <AlertDialog
            open={activeWishlistToRemove !== null}
            onOpenChange={(open) => {
              if (!open) setActiveWishlistToRemove(null);
            }}
          >
            <AlertDialogContent className="rounded-none">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-black uppercase">
                  Remove from {activeWishlistToRemove.name} wishlist?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  Are you sure you want to remove &quot;{game.name}&quot; from
                  your {activeWishlistToRemove.name} wishlist?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4 gap-3">
                <AlertDialogCancel
                  className="font-bold rounded-none flex-1 cursor-pointer"
                  onClick={() => setActiveWishlistToRemove(null)}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    const targetWishlist = activeWishlistToRemove;
                    setActiveWishlistToRemove(null);
                    removeWishlistMutation.mutate(targetWishlist);
                  }}
                  className="font-bold rounded-none flex-1 cursor-pointer"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </>
  );
}
