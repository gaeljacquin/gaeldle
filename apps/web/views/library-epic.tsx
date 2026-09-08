'use client';

import { useMemo, useState, useEffect, ViewTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  IconLibrary,
  IconChecklist,
  IconTrash,
  IconRestore,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/button';
import { LibraryFilterToggleGroup } from '@/components/library-filter-toggle-group';
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
import type { Game } from '@workspace/db';
import { DashboardHeader } from '@/components/dashboard-header';
import { GameListControls } from '@/components/game-list-controls';
import { GameListContent } from '@/components/game-list-content';
import {
  useEpicLibraryStore,
  type SortField,
  type SortDir,
  type SortOption,
} from '@/lib/stores/game-list-store';
import {
  useGameListFilters,
  parseSortOption,
} from '@/lib/hooks/use-game-list-filters';
import { getEpicLibraryGames } from '@/lib/services/library.service';
import {
  deleteBulkGames,
  type PaginatedResponse,
} from '@/lib/services/game.service';

export type EpicLibraryFilter = 'all' | 'owned' | 'demos';

export function LibraryEpicView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Read filter from URL ('all' | 'owned' | 'demos')
  const urlFilter = searchParams.get('filter');
  const filter: EpicLibraryFilter =
    urlFilter === 'owned' || urlFilter === 'demos' ? urlFilter : 'all';

  const store = useEpicLibraryStore();
  const { view, setView } = store;
  const filters = useGameListFilters({ store });

  // Query all games in Epic library
  const {
    data: allGames = [],
    isLoading,
    isFetching,
  } = useQuery<Game[]>({
    queryKey: ['library', 'epic'],
    queryFn: getEpicLibraryGames,
  });

  // Calculate counts for each toggle option
  const allCount = allGames.length;
  const ownedCount = useMemo(
    () => allGames.filter((game) => !game.epicDemo).length,
    [allGames],
  );
  const demosCount = useMemo(
    () => allGames.filter((game) => Boolean(game.epicDemo)).length,
    [allGames],
  );

  const handleFilterChange = (newFilter: EpicLibraryFilter) => {
    filters.form.setFieldValue('page', 1);

    const params = new URLSearchParams(searchParams.toString());
    if (newFilter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', newFilter);
    }
    params.set('page', '1');

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    filters.clearSearch();

    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.delete('searchIgdbId');
    params.delete('filter');
    params.set('page', '1');

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // 1. Filter by toggle group (All / Owned / Demos)
  // In this context, 'Owned' means not a demo (!game.epicDemo)
  const toggleFilteredGames = useMemo(() => {
    if (filter === 'owned') {
      return allGames.filter((game) => !game.epicDemo);
    }
    if (filter === 'demos') {
      return allGames.filter((game) => Boolean(game.epicDemo));
    }
    return allGames;
  }, [allGames, filter]);

  // 2. Filter by search & searchIgdbId
  const searchFilteredGames = useMemo(() => {
    let result = toggleFilteredGames;

    if (filters.debouncedSearch.trim()) {
      const query = filters.debouncedSearch.trim().toLowerCase();
      result = result.filter((game) => game.name.toLowerCase().includes(query));
    }

    if (filters.debouncedSearchIgdbId.trim()) {
      const idStr = filters.debouncedSearchIgdbId.trim();
      result = result.filter((game) => String(game.igdbId).includes(idStr));
    }

    return result;
  }, [
    toggleFilteredGames,
    filters.debouncedSearch,
    filters.debouncedSearchIgdbId,
  ]);

  // 3. Sort
  const sortedGames = useMemo(() => {
    const { sortBy, sortDir }: { sortBy: SortField; sortDir: SortDir } =
      parseSortOption(filters.formValues.sortOption as SortOption);

    const list = [...searchFilteredGames].sort((a, b) => {
      if (sortBy === 'firstReleaseDate') {
        const dateA = a.firstReleaseDate;
        const dateB = b.firstReleaseDate;
        if (dateA == null && dateB == null) return 0;
        if (dateA == null) return 1;
        if (dateB == null) return -1;
        return dateA - dateB;
      }

      if (sortBy === 'createdAt') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      }

      if (sortBy === 'igdbId') {
        return a.igdbId - b.igdbId;
      }

      return a.name.localeCompare(b.name);
    });

    if (sortDir === 'desc') {
      list.reverse();
    }

    return list;
  }, [searchFilteredGames, filters.formValues.sortOption]);

  // 4. Paginate
  const pageSizeNumber = Number.parseInt(filters.formValues.pageSize, 10) || 10;
  const totalItems = sortedGames.length;
  const totalPages =
    totalItems > 0 ? Math.ceil(totalItems / pageSizeNumber) : 0;
  const currentPage = Math.min(
    Math.max(1, filters.formValues.page),
    totalPages || 1,
  );

  // Auto-correct page if current page exceeds totalPages after filtering
  useEffect(() => {
    if (totalPages > 0 && filters.formValues.page > totalPages) {
      filters.form.setFieldValue('page', 1);
    }
  }, [totalPages, filters.formValues.page, filters.form]);

  const paginatedData = useMemo<PaginatedResponse<Game>>(() => {
    const offset = (currentPage - 1) * pageSizeNumber;
    const paged = sortedGames.slice(offset, offset + pageSizeNumber);
    return {
      data: paged,
      meta: {
        page: currentPage,
        pageSize: pageSizeNumber,
        total: totalItems,
      },
    };
  }, [sortedGames, currentPage, pageSizeNumber, totalItems]);

  // Bulk delete mutation
  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => deleteBulkGames(ids),
    onSuccess: () => {
      const successMessage = `${selectedIds.size} ${selectedIds.size === 1 ? 'game' : 'games'} deleted successfully`;

      queryClient.invalidateQueries({ queryKey: ['library', 'epic'] });
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
    if (selectedIds.size === 0) return;
    deleteMutation.mutate(Array.from(selectedIds));
    setIsDeleteDialogOpen(false);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  return (
    <ViewTransition>
      <div className="flex flex-col min-h-full bg-background">
        <DashboardHeader
          title="Epic Library"
          icon={IconLibrary}
          extraElements={
            <GameListControls
              form={filters.form}
              formValues={filters.formValues}
              skipDebounceSearchRef={filters.skipDebounceSearchRef}
              skipDebounceSearchIgdbIdRef={filters.skipDebounceSearchIgdbIdRef}
              clearSearch={clearAllFilters}
              totalPages={totalPages}
              totalItems={totalItems}
              view={view}
              onViewChange={setView}
              isFiltered={filter !== 'all'}
              filterControl={
                <LibraryFilterToggleGroup
                  value={filter}
                  onValueChange={handleFilterChange}
                  counts={
                    !isLoading
                      ? {
                          all: allCount,
                          owned: ownedCount,
                          demos: demosCount,
                        }
                      : undefined
                  }
                  className="bg-card border-border"
                />
              }
              extraControls={
                /* Multi-select controls */
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
            (filters.isDebouncing || isLoading || isFetching) &&
              'opacity-50 pointer-events-none',
          )}
        >
          <GameListContent
            data={paginatedData}
            isLoading={isLoading}
            view={view}
            parsedPageSize={pageSizeNumber}
            formSearch={filters.formValues.search}
            formSearchIgdbId={filters.formValues.searchIgdbId}
            isMultiSelect={isMultiSelect}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            searchParams={filters.searchParams}
            onClearSearch={clearAllFilters}
          />
        </div>
      </div>
    </ViewTransition>
  );
}

export default LibraryEpicView;
