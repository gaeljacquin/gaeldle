'use client';

import { ViewTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getXboxWishlistGames,
  type PaginatedResponse,
} from '@/lib/services/game.service';
import { IconBrandXbox } from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import type { Game } from '@workspace/db';
import { DashboardHeader } from '@/components/dashboard-header';
import { useWishlistXboxStore } from '@/lib/stores/game-list-store';
import { useGameListFilters } from '@/lib/hooks/use-game-list-filters';
import { GameListControls } from '@/components/game-list-controls';
import { GameListContent } from '@/components/game-list-content';

export function WishlistXboxView() {
  const store = useWishlistXboxStore();
  const { view, setView } = store;
  const filters = useGameListFilters({ store });

  const { data, isLoading, isPlaceholderData, isFetching } = useQuery<
    PaginatedResponse<Game>
  >({
    queryKey: [
      'wishlist-xbox',
      filters.formValues.page,
      filters.formValues.pageSize,
      filters.debouncedSearch,
      filters.debouncedSearchIgdbId,
      filters.sortBy,
      filters.sortDir,
    ],
    queryFn: () =>
      getXboxWishlistGames(
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
          title="XBOX Wishlist"
          icon={IconBrandXbox}
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
            onClearSearch={filters.clearSearch}
          />
        </div>
      </div>
    </ViewTransition>
  );
}

export default WishlistXboxView;
