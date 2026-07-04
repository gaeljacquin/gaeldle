'use client';

import { useEffect, useMemo, useRef, useState, ViewTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { useSelector } from '@tanstack/react-store';
import {
  getPaginatedGames,
  deleteBulkGames,
  PaginatedResponse,
} from '@/lib/services/game.service';
import { Timeline2Card } from '@/components/timeline-2-card';
import { Input } from '@workspace/ui/input';
import { Button } from '@workspace/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@workspace/ui/dropdown-menu';
import { Badge } from '@workspace/ui/badge';
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
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconX,
  IconChecklist,
  IconTrash,
  IconDashboard,
  IconSelector,
  IconCalendar,
  IconDeviceGamepad,
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { Game, NumericString } from '@workspace/api-contract';
import { Checkbox } from '@workspace/ui/checkbox';
import Link from 'next/link';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/dashboard-header';
import { Timeline2CardSkeleton } from '@/components/timeline-2-card-skeleton';
import {
  type SortOption,
  sortOptions,
  useDashboardStore,
  pageSizes,
  viewOptions,
  SortDir,
  SortField,
} from '@/lib/stores/dashboard-store';

export default function Dashboard() {
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const {
    sortOption,
    setSortOption,
    pageSize,
    setPageSize,
    page,
    setPage,
    view,
    setView,
  } = useDashboardStore();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      search: '',
      searchIgdbId: '',
      sortOption: sortOption,
      pageSize: pageSize,
      page: page,
    },
  });

  const formValues = useSelector(form.store, (state) => state.values);
  const isFirstRender = useRef(true);

  // Sync form values back to the zustand store when they change
  useEffect(() => {
    setSortOption(formValues.sortOption);
  }, [formValues.sortOption, setSortOption]);

  useEffect(() => {
    setPageSize(formValues.pageSize);
  }, [formValues.pageSize, setPageSize]);

  useEffect(() => {
    setPage(formValues.page);
  }, [formValues.page, setPage]);

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedSearchIgdbId, setDebouncedSearchIgdbId] = useState('');
  const skipDebounceSearchRef = useRef(false);
  const skipDebounceSearchIgdbIdRef = useRef(false);

  // Debounce search value with bypass
  useEffect(() => {
    if (skipDebounceSearchRef.current) {
      skipDebounceSearchRef.current = false;
      setDebouncedSearch(formValues.search);

      return;
    }

    const handler = setTimeout(() => {
      setDebouncedSearch(formValues.search);
    }, 500);

    return () => clearTimeout(handler);
  }, [formValues.search]);

  // Debounce searchIgdbId value with bypass
  useEffect(() => {
    if (skipDebounceSearchIgdbIdRef.current) {
      skipDebounceSearchIgdbIdRef.current = false;
      setDebouncedSearchIgdbId(formValues.searchIgdbId);

      return;
    }

    const handler = setTimeout(() => {
      setDebouncedSearchIgdbId(formValues.searchIgdbId);
    }, 500);

    return () => clearTimeout(handler);
  }, [formValues.searchIgdbId]);

  const isDebouncing =
    formValues.search !== debouncedSearch ||
    formValues.searchIgdbId !== debouncedSearchIgdbId;

  // Reset page to 1 only when debounced search values actually change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      return;
    }

    form.setFieldValue('page', 1);
  }, [debouncedSearch, debouncedSearchIgdbId, form]);

  const [sortBy, sortDir] = formValues.sortOption.split('-') as [
    SortField,
    SortDir,
  ];

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => deleteBulkGames(ids),
    onSuccess: () => {
      const successMessage = `${selectedIds.size} ${selectedIds.size === 1 ? 'game' : 'games'} deleted successfully`;

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

  const { data, isLoading, isPlaceholderData } = useQuery<
    PaginatedResponse<Game>
  >({
    queryKey: [
      'games',
      formValues.page,
      formValues.pageSize,
      debouncedSearch,
      debouncedSearchIgdbId,
      sortBy,
      sortDir,
    ],
    queryFn: () =>
      getPaginatedGames(
        formValues.page,
        Number.parseInt(formValues.pageSize, 10),
        debouncedSearch,
        sortBy,
        sortDir,
        debouncedSearchIgdbId,
      ),
    placeholderData: (previousData) => previousData,
  });

  const totalPages = data?.meta?.total
    ? Math.ceil(data.meta.total / Number.parseInt(formValues.pageSize, 10))
    : 0;

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

  const dataLengthZero = () => {
    if (!data || isLoading) {
      if (view === 'list') {
        return (
          <div className="grid gap-6 grid-cols-1">
            {Array.from({
              length: Number.parseInt(formValues.pageSize, 10),
            }).map((_, i) => (
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
          {Array.from({ length: Number.parseInt(formValues.pageSize, 10) }).map(
            (_, i) => (
              <Timeline2CardSkeleton
                key={i}
                className="sm:w-36 sm:h-56"
                showTopBanner={false}
              />
            ),
          )}
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
            {formValues.search || formValues.searchIgdbId
              ? `We couldn't find any games matching your search criteria.`
              : 'The library is currently empty.'}
          </p>
          {(formValues.search || formValues.searchIgdbId) && (
            <Button
              variant="link"
              onClick={() => {
                skipDebounceSearchRef.current = true;
                skipDebounceSearchIgdbIdRef.current = true;
                form.setFieldValue('search', '');
                form.setFieldValue('searchIgdbId', '');
                form.setFieldValue('page', 1);
              }}
              className="mt-2"
            >
              Clear search
            </Button>
          )}
        </div>
      );
    }

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
          {data?.data.map((game: Game) => (
            <div
              key={game.id}
              className={cn(
                'transition-opacity duration-200 relative group/game',
                isPlaceholderData && 'opacity-50',
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
                  href={isMultiSelect ? '#' : `/dashboard/games/${game.igdbId}`}
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
                        isMultiSelect ? '#' : `/dashboard/games/${game.igdbId}`
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
  };

  return (
    <ViewTransition>
      <div className="flex flex-col min-h-full bg-background">
        <DashboardHeader
          title="Dashboard"
          icon={IconDashboard}
          extraElements={
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
                              if (val !== field.state.value) {
                                field.handleChange(val as SortOption);
                                form.setFieldValue('page', 1);
                              }
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
                              if (val !== field.state.value) {
                                field.handleChange(val as NumericString);
                                form.setFieldValue('page', 1);
                              }
                            }}
                          >
                            {pageSizes.map((sz, index) => {
                              return (
                                <DropdownMenuRadioItem
                                  key={index + '-' + sz}
                                  value={sz}
                                  className="pl-4 cursor-pointer data-unchecked:focus:bg-accent data-unchecked:focus:text-accent-foreground"
                                  closeOnClick={true}
                                >
                                  {sz}
                                </DropdownMenuRadioItem>
                              );
                            })}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </form.Field>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-row items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                  <div className="flex bg-muted p-1 border border-border">
                    {viewOptions.map((viewOption) => (
                      <Button
                        key={viewOption.value}
                        variant={
                          view === viewOption.value ? 'default' : 'ghost'
                        }
                        size="icon"
                        onClick={() => setView(viewOption.value)}
                        title={viewOption.label}
                        className="cursor-pointer"
                      >
                        <viewOption.icon size={20} />
                      </Button>
                    ))}
                  </div>

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

                    {isMultiSelect && (
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
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
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
                          formValues.page *
                            Number.parseInt(formValues.pageSize, 10),
                          data?.meta?.total || 0,
                        )}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium text-foreground">
                        {data?.meta?.total || 0}
                      </span>
                    </div>

                    <form.Field name="page">
                      {(field) => (
                        <div className="flex items-center gap-1 order-1 sm:order-2">
                          <Button
                            variant="outline"
                            size="icon-xs"
                            disabled={field.state.value === 1}
                            onClick={() =>
                              field.handleChange(field.state.value - 1)
                            }
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
                                    field.state.value === p
                                      ? 'default'
                                      : 'ghost'
                                  }
                                  size="icon-xs"
                                  className={cn(
                                    'size-8 cursor-pointer',
                                    field.state.value === p &&
                                      'pointer-events-none',
                                  )}
                                  onClick={() =>
                                    field.handleChange(p as number)
                                  }
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
                            onClick={() =>
                              field.handleChange(field.state.value + 1)
                            }
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
          }
        />

        <div
          className={cn(
            'container mx-auto px-4 py-8 flex-1 transition-opacity duration-200',
            isDebouncing && 'opacity-50 pointer-events-none',
          )}
        >
          {dataLengthZero()}
        </div>
      </div>
    </ViewTransition>
  );
}
