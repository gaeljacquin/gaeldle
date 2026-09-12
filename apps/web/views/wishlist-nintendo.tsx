'use client';

import { ViewTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  paginatedNintendoWishlistGamesQueryOptions,
  wishlistLastUpdatedQueryOptions,
  formatWishlistLastUpdated,
} from '@/lib/services/game.service';
import { IconHeart } from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { DashboardHeader } from '@/components/dashboard-header';
import { useWishlistNintendoStore } from '@/lib/stores/game-list-store';
import { useGameListFilters } from '@/lib/hooks/use-game-list-filters';
import { useBulkDelete } from '@/lib/hooks/use-bulk-delete';
import { BulkDeleteControls } from '@/components/bulk-delete-controls';
import { GameListControls } from '@/components/game-list-controls';
import { GameListContent } from '@/components/game-list-content';
import { calcTotalPages } from '@/lib/utils/pagination';

export function WishlistNintendoView() {
  const store = useWishlistNintendoStore();
  const { view, setView } = store;
  const filters = useGameListFilters({ store });

  const bulkDelete = useBulkDelete({
    queryKeysToInvalidate: ['nintendoWishlistGames', 'games'],
    locationName: 'your wishlist',
    wishlistKey: 'nintendoWishlist',
  });

  const { data, isLoading, isPlaceholderData, isFetching } = useQuery({
    ...paginatedNintendoWishlistGamesQueryOptions(
      filters.formValues.page,
      Number.parseInt(filters.formValues.pageSize, 10),
      filters.debouncedSearch,
      filters.sortBy,
      filters.sortDir,
      filters.debouncedSearchIgdbId,
    ),
    placeholderData: (previousData) => previousData,
  });

  const { data: lastUpdatedData } = useQuery(
    wishlistLastUpdatedQueryOptions('nintendoWishlist'),
  );
  const lastUpdatedText = formatWishlistLastUpdated(lastUpdatedData);

  const totalPages = calcTotalPages(
    data?.meta?.total,
    filters.formValues.pageSize,
  );

  return (
    <ViewTransition>
      <div className="flex flex-col min-h-full bg-background">
        <DashboardHeader
          title="Nintendo Wishlist"
          icon={IconHeart}
          rightElement={
            lastUpdatedText ? (
              <span className="text-sm text-muted-foreground">
                {lastUpdatedText}
              </span>
            ) : null
          }
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

export default WishlistNintendoView;
