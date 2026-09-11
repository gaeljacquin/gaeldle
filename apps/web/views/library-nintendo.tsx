'use client';

import { ViewTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  nintendoGamesQueryOptions,
  type NintendoFilter,
} from '@/lib/services/game.service';
import { IconDeviceGamepad2 } from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { DashboardHeader } from '@/components/dashboard-header';
import { useLibraryNintendoStore } from '@/lib/stores/game-list-store';
import { useGameListFilters } from '@/lib/hooks/use-game-list-filters';
import { useBulkDelete } from '@/lib/hooks/use-bulk-delete';
import { BulkDeleteControls } from '@/components/bulk-delete-controls';
import { GameListControls } from '@/components/game-list-controls';
import { GameListContent } from '@/components/game-list-content';
import { LibraryFilterToggleGroup } from '@/components/library-filter-toggle-group';
import { calcTotalPages } from '@/lib/utils/pagination';

export function LibraryNintendoView() {
  const store = useLibraryNintendoStore();
  const { view, setView } = store;
  const filters = useGameListFilters<NintendoFilter>({
    store,
    filterOptions: {
      default: 'all',
      validValues: ['all', 'owned', 'demos'],
    },
  });

  const bulkDelete = useBulkDelete({
    queryKeysToInvalidate: ['nintendo-games', 'games'],
    locationName: 'your Nintendo library',
  });

  const { data, isLoading, isPlaceholderData, isFetching } = useQuery({
    ...nintendoGamesQueryOptions(
      filters.formValues.page,
      Number.parseInt(filters.formValues.pageSize, 10),
      filters.debouncedSearch,
      filters.sortBy,
      filters.sortDir,
      filters.debouncedSearchIgdbId,
      filters.filter,
    ),
    placeholderData: (previousData) => previousData,
  });

  const totalPages = calcTotalPages(
    data?.meta?.total,
    filters.formValues.pageSize,
  );

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
              clearSearch={filters.clearSearch}
              totalPages={totalPages}
              totalItems={data?.meta?.total ?? 0}
              view={view}
              onViewChange={setView}
              isFiltered={filters.filter !== 'all'}
              filterControl={
                <LibraryFilterToggleGroup
                  value={filters.filter}
                  onValueChange={filters.setFilter}
                />
              }
              extraControls={<BulkDeleteControls bulkDelete={bulkDelete} />}
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

export default LibraryNintendoView;
