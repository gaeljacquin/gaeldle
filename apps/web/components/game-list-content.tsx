'use client';

import { ViewTransition } from 'react';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { Timeline2Card } from '@/components/timeline-2-card';
import { Timeline2CardSkeleton } from '@/components/timeline-2-card-skeleton';
import { Button } from '@workspace/ui/button';
import { Badge } from '@workspace/ui/badge';
import { Checkbox } from '@workspace/ui/checkbox';
import {
  IconSearch,
  IconCalendar,
  IconDeviceGamepad,
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import type { Game } from '@workspace/db';
import type { PaginatedResponse } from '@/lib/services/game.service';
import type { ViewOption } from '@/lib/stores/game-list-store';
import Link from 'next/link';

export interface GameListContentProps {
  data: PaginatedResponse<Game> | undefined;
  isLoading: boolean;
  view: ViewOption | string;
  parsedPageSize: number;
  formSearch: string;
  formSearchIgdbId: string;
  isMultiSelect?: boolean;
  selectedIds?: Set<number>;
  toggleSelect?: (id: number) => void;
  searchParams?: URLSearchParams | ReadonlyURLSearchParams;
  onClearSearch?: () => void;
}

const EMPTY_SET = new Set<number>();

export function GameListContent({
  data,
  isLoading,
  view,
  parsedPageSize,
  formSearch,
  formSearchIgdbId,
  isMultiSelect = false,
  selectedIds = EMPTY_SET,
  toggleSelect = () => {},
  searchParams,
  onClearSearch,
}: GameListContentProps) {
  if (!data || isLoading) {
    if (view === 'list') {
      return (
        <div className="grid gap-6 grid-cols-1">
          {Array.from({ length: parsedPageSize }).map((_, i) => (
            <div
              key={i}
              className="flex gap-8 p-6 border border-border bg-card animate-pulse"
            >
              {/* Left side card skeleton */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="relative overflow-hidden border-2 border-border bg-muted w-32 h-44 shadow-sm">
                  <div className="absolute inset-x-0 bottom-0 h-6 border-t bg-muted-foreground/10" />
                </div>
              </div>

              {/* Right side info skeleton */}
              <div className="flex flex-col justify-start pt-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div className="h-8 w-1/3 bg-muted rounded" />
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <div className="h-5 w-24 bg-muted rounded-none" />
                  <div className="h-5 w-20 bg-muted rounded-none" />
                </div>

                <div className="space-y-2 mt-4">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-11/12 bg-muted rounded" />
                  <div className="h-4 w-4/5 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        className={cn(
          'grid gap-6',
          view === 'grid'
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 justify-items-start'
            : 'grid-cols-1',
        )}
      >
        {Array.from({ length: parsedPageSize }).map((_, i) => (
          <Timeline2CardSkeleton
            key={i}
            className="sm:w-36 sm:h-56"
            showTopBanner={false}
          />
        ))}
      </div>
    );
  }

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <IconSearch size={48} className="text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold">No games found</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">
          {formSearch || formSearchIgdbId
            ? `We couldn't find any games matching your search criteria.`
            : 'The library is currently empty.'}
        </p>
        {(formSearch || formSearchIgdbId) && onClearSearch && (
          <Button variant="link" onClick={onClearSearch} className="mt-2">
            Clear search
          </Button>
        )}
      </div>
    );
  }

  const querySuffix =
    searchParams && searchParams.toString()
      ? `?${searchParams.toString()}`
      : '';

  return (
    <div className="space-y-8">
      <div
        className={cn(
          'grid gap-6',
          view === 'grid'
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 justify-items-start'
            : 'grid-cols-1',
        )}
      >
        {data.data.map((game: Game) => (
          <div
            key={game.id}
            className={cn(
              'transition-opacity duration-200 relative group/game',
              view === 'list' &&
                'flex gap-8 p-6 border border-border bg-card hover:bg-accent/50 transition-colors',
            )}
          >
            <div
              className={cn(
                view === 'list'
                  ? 'flex flex-col items-center gap-3 shrink-0'
                  : 'contents',
              )}
            >
              {isMultiSelect && view === 'grid' && (
                <div className="absolute top-2 right-2 z-20">
                  <Checkbox
                    checked={selectedIds.has(game.id)}
                    onCheckedChange={() => toggleSelect(game.id)}
                    className="size-5"
                  />
                </div>
              )}
              <Link
                href={
                  isMultiSelect
                    ? '#'
                    : `/dashboard/games/${game.igdbId}${querySuffix}`
                }
                onClick={(e: React.MouseEvent) => {
                  if (isMultiSelect) {
                    e.preventDefault();
                    toggleSelect(game.id);
                  }
                }}
                className={cn(
                  view === 'grid'
                    ? 'block hover:scale-105 transition-transform'
                    : 'shrink-0',
                )}
              >
                <ViewTransition name={`game-details-${game.igdbId}`}>
                  <Timeline2Card
                    game={game}
                    showTopBanner={false}
                    bannerColor={selectedIds.has(game.id) ? 'red' : 'none'}
                    className={cn(view === 'grid' && 'sm:w-36 sm:h-52')}
                  />
                </ViewTransition>
              </Link>
            </div>

            {view === 'list' && (
              <div className="flex flex-col justify-start pt-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href={
                      isMultiSelect
                        ? '#'
                        : `/dashboard/games/${game.igdbId}${querySuffix}`
                    }
                    onClick={(e: React.MouseEvent) => {
                      if (isMultiSelect) {
                        e.preventDefault();
                        toggleSelect(game.id);
                      }
                    }}
                    className="hover:text-primary transition-colors min-w-0 flex-1"
                  >
                    <h3 className="text-2xl font-black uppercase tracking-tight truncate">
                      {game.name}
                    </h3>
                  </Link>
                  {isMultiSelect && (
                    <Checkbox
                      checked={selectedIds.has(game.id)}
                      onCheckedChange={() => toggleSelect(game.id)}
                      className="size-5 shrink-0 z-20"
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {game.firstReleaseDate && (
                    <Badge className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider text-black h-auto">
                      <IconCalendar aria-hidden="true" size={12} />
                      {new Date(
                        game.firstReleaseDate * 1000,
                      ).toLocaleDateString()}
                    </Badge>
                  )}
                  <Badge className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider text-black h-auto">
                    <IconDeviceGamepad aria-hidden="true" size={12} />
                    ID: {game.igdbId}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed mt-4">
                  {game.summary || 'No description available for this game.'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
