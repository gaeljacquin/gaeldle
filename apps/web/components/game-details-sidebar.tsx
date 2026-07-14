'use client';

import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { getGameByIgdbId, syncGame } from '@/lib/services/game.service';
import { Button } from '@workspace/ui/button';
import { toast } from 'sonner';
import {
  IconTrash,
  IconRefresh,
  IconCalendar,
  IconDeviceGamepad,
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@/components/badge';

export default function GameDetailsSidebar({
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
