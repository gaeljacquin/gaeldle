'use client';

import { useMemo, type ReactNode } from 'react';
import { Input } from '@workspace/ui/input';
import { Button } from '@workspace/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@workspace/ui/dropdown-menu';
import {
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconX,
  IconSelector,
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { NumericString } from '@workspace/shared';
import {
  type SortOption,
  type ViewOption,
  sortOptions,
  pageSizes,
  viewOptions,
} from '@/lib/stores/game-list-store';
import type {
  UseGameListFiltersReturn,
  GameListFilterFormValues,
} from '@/lib/hooks/use-game-list-filters';

export interface GameListControlsProps {
  form: UseGameListFiltersReturn['form'];
  formValues: GameListFilterFormValues;
  skipDebounceSearchRef: UseGameListFiltersReturn['skipDebounceSearchRef'];
  skipDebounceSearchIgdbIdRef: UseGameListFiltersReturn['skipDebounceSearchIgdbIdRef'];
  clearSearch: UseGameListFiltersReturn['clearSearch'];

  totalPages: number;
  totalItems: number;
  view?: ViewOption;
  onViewChange?: (view: ViewOption) => void;
  extraControls?: ReactNode;
  isFiltered?: boolean;
  filterControl?: ReactNode;
  isClearDisabled?: boolean;
}

export function GameListControls({
  form,
  formValues,
  skipDebounceSearchRef,
  skipDebounceSearchIgdbIdRef,
  clearSearch,
  totalPages,
  totalItems,
  view,
  onViewChange,
  extraControls,
  isFiltered,
  filterControl,
  isClearDisabled,
}: GameListControlsProps) {
  const paginationRange = useMemo(() => {
    if (!totalPages) {
      return [];
    }

    const range: (number | string)[] = [];
    const siblingCount = 1;
    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalPages) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }

      return range;
    }

    const leftSiblingIndex = Math.max(formValues.page - siblingCount, 1);
    const rightSiblingIndex = Math.min(
      formValues.page + siblingCount,
      totalPages,
    );
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;

      for (let i = 1; i <= leftItemCount; i++) {
        range.push(i);
      }

      range.push('...', totalPages);
    } else if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      range.push(1, '...');

      for (let i = totalPages - rightItemCount + 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      range.push(1, '...');

      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        range.push(i);
      }

      range.push('...', totalPages);
    }

    return range;
  }, [totalPages, formValues.page]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="flex flex-col sm:flex-row flex-1 gap-4">
          <form.Field name="search">
            {(field) => (
              <div className="relative flex-1 group">
                <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Search games by title..."
                  className="px-9"
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                />
                {field.state.value ? (
                  <button
                    onClick={() => {
                      skipDebounceSearchRef.current = true;
                      field.handleChange('');
                      form.setFieldValue('page', 1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <IconX size={14} />
                  </button>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name="searchIgdbId">
            {(field) => (
              <div className="relative w-full sm:w-64 group">
                <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Search games by IGDB ID..."
                  className="pl-9 pr-9"
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                />
                {field.state.value ? (
                  <button
                    onClick={() => {
                      skipDebounceSearchIgdbIdRef.current = true;
                      field.handleChange('');
                      form.setFieldValue('page', 1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <IconX size={14} />
                  </button>
                ) : null}
              </div>
            )}
          </form.Field>
        </div>

        <div className="flex items-center gap-4 justify-between sm:justify-end">
          <form.Field name="sortOption">
            {(field) => (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="default"
                      className="flex-1 sm:w-40 sm:flex-none justify-between px-4 font-normal cursor-pointer"
                    >
                      <span className="truncate">
                        {
                          sortOptions.find(
                            (opt) => opt.value === field.state.value,
                          )?.label
                        }
                      </span>
                      <IconSelector className="text-muted-foreground size-4 shrink-0" />
                    </Button>
                  }
                />
                <DropdownMenuContent
                  className="w-(--anchor-width) min-w-0 p-1 bg-muted"
                  align="end"
                >
                  <DropdownMenuRadioGroup
                    value={field.state.value}
                    onValueChange={(val) => {
                      field.handleChange(val as SortOption);
                      form.setFieldValue('page', 1);
                    }}
                  >
                    {sortOptions.map((opt) => (
                      <DropdownMenuRadioItem
                        key={opt.value}
                        value={opt.value}
                        className="pl-4 cursor-pointer data-unchecked:focus:bg-accent data-unchecked:focus:text-accent-foreground"
                        closeOnClick={true}
                      >
                        {opt.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </form.Field>

          <form.Field name="pageSize">
            {(field) => (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="default"
                      className="flex-1 sm:w-20 sm:flex-none justify-between px-4 font-normal cursor-pointer"
                    >
                      <span>{field.state.value}</span>
                      <IconSelector className="text-muted-foreground size-4 shrink-0" />
                    </Button>
                  }
                />
                <DropdownMenuContent
                  className="w-(--anchor-width) min-w-0 p-1 bg-muted"
                  align="end"
                >
                  <DropdownMenuRadioGroup
                    value={field.state.value}
                    onValueChange={(val) => {
                      field.handleChange(val as NumericString);
                      form.setFieldValue('page', 1);
                    }}
                  >
                    {pageSizes.map((sz, index) => (
                      <DropdownMenuRadioItem
                        key={index + '-' + sz}
                        value={sz}
                        className="pl-4 cursor-pointer data-unchecked:focus:bg-accent data-unchecked:focus:text-accent-foreground"
                        closeOnClick={true}
                      >
                        {sz}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </form.Field>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {filterControl ? <div>{filterControl}</div> : null}

        <div className="flex items-center justify-end sm:ml-auto">
          <Button
            variant="outline"
            onClick={clearSearch}
            disabled={
              isClearDisabled ??
              (!formValues.search && !formValues.searchIgdbId && !isFiltered)
            }
            className="w-full sm:w-auto cursor-pointer gap-2"
            title="Clear search and filters"
          >
            <IconX size={16} />
            Clear search and filters
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-row items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          {view && onViewChange ? (
            <div className="flex bg-muted p-1 border border-border">
              {viewOptions.map((viewOption) => (
                <Button
                  key={viewOption.value}
                  variant={view === viewOption.value ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => onViewChange(viewOption.value)}
                  title={viewOption.label}
                  className="cursor-pointer"
                >
                  <viewOption.icon size={20} />
                </Button>
              ))}
            </div>
          ) : null}

          {extraControls}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="text-sm text-muted-foreground whitespace-nowrap order-2 sm:order-1">
              Showing{' '}
              <span className="font-medium text-foreground">
                {(formValues.page - 1) *
                  Number.parseInt(formValues.pageSize, 10) +
                  1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-foreground">
                {Math.min(
                  formValues.page * Number.parseInt(formValues.pageSize, 10),
                  totalItems || 0,
                )}
              </span>{' '}
              of{' '}
              <span className="font-medium text-foreground">
                {totalItems || 0}
              </span>
            </div>

            <form.Field name="page">
              {(field) => (
                <div className="flex items-center gap-1 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    disabled={field.state.value === 1}
                    onClick={() => field.handleChange(field.state.value - 1)}
                    className="size-8 cursor-pointer"
                  >
                    <IconChevronLeft size={16} />
                  </Button>

                  <div className="flex items-center gap-1 mx-1">
                    {paginationRange.map((p, i) =>
                      p === '...' ? (
                        <span
                          key={`dots-${i + 1}`}
                          className="w-8 flex justify-center text-muted-foreground select-none"
                          aria-hidden="true"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={
                            field.state.value === p ? 'default' : 'ghost'
                          }
                          size="icon-xs"
                          className={cn(
                            'size-8 cursor-pointer',
                            field.state.value === p && 'pointer-events-none',
                          )}
                          onClick={() => field.handleChange(p as number)}
                        >
                          {p}
                        </Button>
                      ),
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="icon-xs"
                    disabled={field.state.value === totalPages}
                    onClick={() => field.handleChange(field.state.value + 1)}
                    className="size-8 cursor-pointer"
                  >
                    <IconChevronRight size={16} />
                  </Button>
                </div>
              )}
            </form.Field>
          </div>
        )}
      </div>
    </div>
  );
}
