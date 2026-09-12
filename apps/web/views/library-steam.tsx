'use client';

import { useMemo, ViewTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconBrandSteam } from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { LibraryFilterToggleGroup } from '@/components/library-filter-toggle-group';
import { DashboardHeader } from '@/components/dashboard-header';
import { GameListControls } from '@/components/game-list-controls';
import { GameListContent } from '@/components/game-list-content';
import { steamGamesQueryOptions } from '@/lib/services/game.service';
import { useSteamLibraryStore } from '@/lib/stores/game-list-store';
import { useSteamLibraryFilters } from '@/lib/hooks/use-steam-library-filters';
import { useBulkDelete } from '@/lib/hooks/use-bulk-delete';
import { BulkDeleteControls } from '@/components/bulk-delete-controls';
import { calcTotalPages } from '@/lib/utils/pagination';

export function LibrarySteamView() {
  const store = useSteamLibraryStore();
  const { view, setView } = store;
  const filters = useSteamLibraryFilters({ store });

  const bulkDelete = useBulkDelete({
    queryKeysToInvalidate: ['steam-games', 'games'],
    locationName: 'your Steam library',
  });

  const { data, isLoading, isFetching } = useQuery(steamGamesQueryOptions());

  const allGames = useMemo(() => data ?? [], [data]);

  const counts = useMemo(() => {
    let all = 0;
    let owned = 0;
    let demos = 0;

    for (const game of allGames) {
      all++;
      if (game.steamDemo) {
        demos++;
      } else {
        owned++;
      }
    }

    return { all, owned, demos };
  }, [allGames]);

  // 1. Filter by ownership/demo status
  const filteredByDemo = useMemo(() => {
    if (filters.filter === 'owned') {
      return allGames.filter((g) => !g.steamDemo);
    }
    if (filters.filter === 'demos') {
      return allGames.filter((g) => Boolean(g.steamDemo));
    }
    return allGames;
  }, [allGames, filters.filter]);

  // 2. Filter by search query and IGDB ID
  const filteredGames = useMemo(() => {
    let result = filteredByDemo;

    if (filters.debouncedSearch) {
      const searchLower = filters.debouncedSearch.toLowerCase().trim();
      result = result.filter((g) => g.name.toLowerCase().includes(searchLower));
    }

    if (filters.debouncedSearchIgdbId) {
      const igdbIdStr = filters.debouncedSearchIgdbId.trim();
      result = result.filter((g) => String(g.igdbId).includes(igdbIdStr));
    }

    return result;
  }, [filteredByDemo, filters.debouncedSearch, filters.debouncedSearchIgdbId]);

  // 3. Sort
  const { sortBy, sortDir } = filters;
  const sortedGames = useMemo(() => {
    const list = [...filteredGames];

    list.sort((a, b) => {
      if (sortBy === 'firstReleaseDate') {
        const dateA =
          a.firstReleaseDate ?? (sortDir === 'asc' ? Infinity : -Infinity);
        const dateB =
          b.firstReleaseDate ?? (sortDir === 'asc' ? Infinity : -Infinity);
        return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (sortBy === 'createdAt') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortDir === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (sortBy === 'igdbId') {
        return sortDir === 'asc' ? a.igdbId - b.igdbId : b.igdbId - a.igdbId;
      }

      return sortDir === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });

    return list;
  }, [filteredGames, sortBy, sortDir]);

  // 4. Paginate
  const pageSize = Number.parseInt(filters.formValues.pageSize, 10);
  const totalPages = calcTotalPages(sortedGames.length, pageSize);
  const currentPage = Math.max(1, filters.formValues.page);

  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedGames.slice(start, start + pageSize);
  }, [sortedGames, currentPage, pageSize]);

  const paginatedResponse = useMemo(
    () => ({
      data: paginatedGames,
      meta: {
        total: sortedGames.length,
        page: currentPage,
        pageSize,
      },
    }),
    [paginatedGames, sortedGames.length, currentPage, pageSize],
  );

  const isClearDisabled =
    !filters.formValues.search &&
    !filters.formValues.searchIgdbId &&
    filters.filter === 'all';

  return (
    <ViewTransition>
      <div className="flex flex-col min-h-full bg-background">
        <DashboardHeader
          title="Steam Library"
          icon={IconBrandSteam}
          extraElements={
            <GameListControls
              form={filters.form}
              formValues={filters.formValues}
              skipDebounceSearchRef={filters.skipDebounceSearchRef}
              skipDebounceSearchIgdbIdRef={filters.skipDebounceSearchIgdbIdRef}
              clearSearch={filters.clearSearch}
              totalPages={totalPages}
              totalItems={sortedGames.length}
              view={view}
              onViewChange={setView}
              isClearDisabled={isClearDisabled}
              filterControl={
                <LibraryFilterToggleGroup
                  value={filters.filter}
                  onValueChange={filters.setFilter}
                  counts={data ? counts : undefined}
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
            data={paginatedResponse}
            isLoading={isLoading}
            view={view}
            parsedPageSize={pageSize}
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

export default LibrarySteamView;
