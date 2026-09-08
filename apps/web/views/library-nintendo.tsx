'use client';

import { ViewTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  getNintendoGames,
  type PaginatedResponse,
  type NintendoFilter,
} from '@/lib/services/game.service';
import { IconDeviceGamepad2 } from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import type { Game } from '@workspace/db';
import { DashboardHeader } from '@/components/dashboard-header';
import { useLibraryNintendoStore } from '@/lib/stores/game-list-store';
import { useGameListFilters } from '@/lib/hooks/use-game-list-filters';
import { GameListControls } from '@/components/game-list-controls';
import { GameListContent } from '@/components/game-list-content';
import { LibraryFilterToggleGroup } from '@/components/library-filter-toggle-group';

export function LibraryNintendoView() {
  const store = useLibraryNintendoStore();
  const { view, setView } = store;
  const filters = useGameListFilters({ store });

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlFilter = searchParams.get('filter');
  const filter: NintendoFilter =
    urlFilter === 'owned' || urlFilter === 'demos' || urlFilter === 'all'
      ? urlFilter
      : 'all';

  const handleFilterChange = (newFilter: NintendoFilter) => {
    filters.form.setFieldValue('page', 1);

    const params = new URLSearchParams(window.location.search);
    if (newFilter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', newFilter);
    }
    params.set('page', '1');

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleClearAll = () => {
    filters.clearSearch();
    if (filter !== 'all') {
      handleFilterChange('all');
    }
  };

  const { data, isLoading, isPlaceholderData, isFetching } = useQuery<
    PaginatedResponse<Game>
  >({
    queryKey: [
      'nintendo-games',
      filters.formValues.page,
      filters.formValues.pageSize,
      filters.debouncedSearch,
      filters.debouncedSearchIgdbId,
      filters.sortBy,
      filters.sortDir,
      filter,
    ],
    queryFn: () =>
      getNintendoGames(
        filters.formValues.page,
        Number.parseInt(filters.formValues.pageSize, 10),
        filters.debouncedSearch,
        filters.sortBy,
        filters.sortDir,
        filters.debouncedSearchIgdbId,
        filter,
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
          title="Nintendo Library"
          icon={IconDeviceGamepad2}
          extraElements={
            <GameListControls
              form={filters.form}
              formValues={filters.formValues}
              skipDebounceSearchRef={filters.skipDebounceSearchRef}
              skipDebounceSearchIgdbIdRef={filters.skipDebounceSearchIgdbIdRef}
              clearSearch={handleClearAll}
              totalPages={totalPages}
              totalItems={data?.meta?.total ?? 0}
              view={view}
              onViewChange={setView}
              isFiltered={filter !== 'all'}
              filterControl={
                <LibraryFilterToggleGroup
                  value={filter}
                  onValueChange={handleFilterChange}
                />
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
            searchParams={filters.searchParams}
            onClearSearch={handleClearAll}
          />
        </div>
      </div>
    </ViewTransition>
  );
}

export default LibraryNintendoView;
