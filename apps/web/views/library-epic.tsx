'use client';

import { useMemo, useEffect, ViewTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconLibrary } from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { LibraryFilterToggleGroup } from '@/components/library-filter-toggle-group';
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
import type { PaginatedResponse } from '@/lib/services/game.service';
import { useBulkDelete } from '@/lib/hooks/use-bulk-delete';
import { BulkDeleteControls } from '@/components/bulk-delete-controls';
import { calcTotalPages } from '@/lib/utils/pagination';

export type EpicLibraryFilter = 'all' | 'owned' | 'demos';

export function LibraryEpicView() {
  const store = useEpicLibraryStore();
  const { view, setView } = store;
  const filters = useGameListFilters<EpicLibraryFilter>({
    store,
    filterOptions: {
      default: 'all',
      validValues: ['all', 'owned', 'demos'],
    },
  });

  const bulkDelete = useBulkDelete({
    queryKeysToInvalidate: [['library', 'epic'], ['games']],
    locationName: 'your library',
  });

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

  // 1. Filter by toggle group (All / Owned / Demos)
  const toggleFilteredGames = useMemo(() => {
    if (filters.filter === 'owned') {
      return allGames.filter((game) => !game.epicDemo);
    }
    if (filters.filter === 'demos') {
      return allGames.filter((game) => Boolean(game.epicDemo));
    }
    return allGames;
  }, [allGames, filters.filter]);

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
  const totalPages = calcTotalPages(totalItems, pageSizeNumber);
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
              clearSearch={filters.clearSearch}
              totalPages={totalPages}
              totalItems={totalItems}
              view={view}
              onViewChange={setView}
              isFiltered={filters.filter !== 'all'}
              filterControl={
                <LibraryFilterToggleGroup
                  value={filters.filter}
                  onValueChange={filters.setFilter}
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
              extraControls={<BulkDeleteControls bulkDelete={bulkDelete} />}
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
            isMultiSelect={bulkDelete.isMultiSelect}
            selectedIds={bulkDelete.selectedIds}
            toggleSelect={bulkDelete.toggleSelect}
            searchParams={filters.searchParams}
            onClearSearch={filters.clearSearch}
          />
        </div>
      </div>
    </ViewTransition>
  );
}

export default LibraryEpicView;
