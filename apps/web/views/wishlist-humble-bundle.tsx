'use client';

import { useState, ViewTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPaginatedHumbleBundleWishlist,
  deleteBulkGames,
  type PaginatedResponse,
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
import {
  IconChecklist,
  IconTrash,
  IconHeart,
  IconRestore,
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import type { Game } from '@workspace/db';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/dashboard-header';
import { useWishlistHumbleBundleStore } from '@/lib/stores/game-list-store';
import { useGameListFilters } from '@/lib/hooks/use-game-list-filters';
import { GameListControls } from '@/components/game-list-controls';
import { GameListContent } from '@/components/game-list-content';

export function WishlistHumbleBundleView() {
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const store = useWishlistHumbleBundleStore();
  const { view, setView } = store;
  const filters = useGameListFilters({ store });
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => deleteBulkGames(ids),
    onSuccess: () => {
      const successMessage = `${selectedIds.size} ${selectedIds.size === 1 ? 'game' : 'games'} deleted successfully`;

      queryClient.invalidateQueries({ queryKey: ['wishlist-humble-bundle'] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
      toast.success(successMessage);
      setSelectedIds(new Set());
      setIsMultiSelect(false);
    },
    onError: () => {
      toast.error('An error occurred while deleting games');
    },
  });

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);

    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }

    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      return;
    }

    deleteMutation.mutate(Array.from(selectedIds));
    setIsDeleteDialogOpen(false);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const { data, isLoading, isPlaceholderData, isFetching } = useQuery<
    PaginatedResponse<Game>
  >({
    queryKey: [
      'wishlist-humble-bundle',
      filters.formValues.page,
      filters.formValues.pageSize,
      filters.debouncedSearch,
      filters.debouncedSearchIgdbId,
      filters.sortBy,
      filters.sortDir,
    ],
    queryFn: () =>
      getPaginatedHumbleBundleWishlist(
        filters.formValues.page,
        Number.parseInt(filters.formValues.pageSize, 10),
        filters.debouncedSearch,
        filters.sortBy,
        filters.sortDir,
        filters.debouncedSearchIgdbId,
      ),
    placeholderData: (previousData) => previousData,
  });

  const totalPages = data?.meta?.total
    ? Math.ceil(
        data.meta.total / Number.parseInt(filters.formValues.pageSize, 10),
      )
    : 0;

  return (
    <ViewTransition>
      <div className="flex flex-col min-h-full bg-background">
        <DashboardHeader
          title="Humble Bundle Wishlist"
          icon={IconHeart}
          extraElements={
            <GameListControls
              form={filters.form}
              formValues={filters.formValues}
              skipDebounceSearchRef={filters.skipDebounceSearchRef}
              skipDebounceSearchIgdbIdRef={filters.skipDebounceSearchIgdbIdRef}
              clearSearch={filters.clearSearch}
              totalPages={totalPages}
              totalItems={data?.meta?.total ?? 0}
              view={view}
              onViewChange={setView}
              extraControls={
                <div className="flex flex-row-reverse md:flex-row items-center gap-4">
                  <Button
                    variant={isMultiSelect ? 'default' : 'outline'}
                    size="icon-lg"
                    onClick={() => {
                      setIsMultiSelect(!isMultiSelect);
                      if (isMultiSelect) clearSelection();
                    }}
                    title="Multi-select"
                    className={cn(
                      'cursor-pointer size-10',
                      isMultiSelect && 'bg-primary text-primary-foreground',
                    )}
                  >
                    <IconChecklist size={22} />
                  </Button>

                  {isMultiSelect ? (
                    <div className="flex items-center gap-4 animate-in fade-in md:slide-in-from-left-4 slide-in-from-right-4 duration-300">
                      <AlertDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                      >
                        <Button
                          variant="default"
                          size="sm"
                          disabled={
                            selectedIds.size === 0 || deleteMutation.isPending
                          }
                          onClick={() => setIsDeleteDialogOpen(true)}
                          className={cn(
                            'h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90',
                            selectedIds.size === 0 || deleteMutation.isPending
                              ? 'cursor-not-allowed'
                              : 'cursor-pointer',
                          )}
                        >
                          <IconTrash size={16} className="mr-2" />
                          Delete ({selectedIds.size})
                        </Button>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete {selectedIds.size}{' '}
                              {selectedIds.size === 1 ? 'game' : 'games'} from
                              your library.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={handleBulkDelete}
                              className="cursor-pointer"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSelection}
                        disabled={selectedIds.size === 0}
                        className={cn(
                          'h-10',
                          selectedIds.size === 0 || deleteMutation.isPending
                            ? 'cursor-not-allowed'
                            : 'cursor-pointer',
                        )}
                      >
                        <span className="flex flex-row gap-2">
                          <IconRestore size={16} />
                          Clear
                        </span>
                      </Button>
                    </div>
                  ) : null}
                </div>
              }
            />
          }
        />

        <div
          className={cn(
            'container mx-auto px-4 py-8 flex-1 transition-opacity duration-200',
            (filters.isDebouncing ||
              isLoading ||
              isPlaceholderData ||
              isFetching) &&
              'opacity-50 pointer-events-none',
          )}
        >
          <GameListContent
            data={data}
            isLoading={isLoading}
            view={view}
            parsedPageSize={Number.parseInt(filters.formValues.pageSize, 10)}
            formSearch={filters.formValues.search}
            formSearchIgdbId={filters.formValues.searchIgdbId}
            isMultiSelect={isMultiSelect}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            searchParams={filters.searchParams}
            onClearSearch={filters.clearSearch}
            emptyMessage="Your Humble Bundle wishlist is currently empty."
          />
        </div>
      </div>
    </ViewTransition>
  );
}

export default WishlistHumbleBundleView;
