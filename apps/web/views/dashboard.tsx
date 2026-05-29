'use client';

import { useState, useMemo, ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { useDebounce } from '@/lib/hooks/use-debounce';
import {
  IconLayoutGrid,
  IconList,
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
import { Game } from '@workspace/api-contract';
import { Checkbox } from '@workspace/ui/checkbox';
import Link from 'next/link';
import { toast } from 'sonner';
import { DashboardPageHeader } from '@/components/dashboard-header';

type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'firstReleaseDate-asc'
  | 'firstReleaseDate-desc'
  | 'igdbId-asc'
  | 'igdbId-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Title A→Z' },
  { value: 'name-desc', label: 'Title Z→A' },
  { value: 'firstReleaseDate-asc', label: 'Release Date ↑' },
  { value: 'firstReleaseDate-desc', label: 'Release Date ↓' },
  { value: 'igdbId-asc', label: 'IGDB ID ↑' },
  { value: 'igdbId-desc', label: 'IGDB ID ↓' },
];

export default function Dashboard() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('10');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('name-asc');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const debouncedSearch = useDebounce(search, 500);

  const [sortBy, sortDir] = sort.split('-') as [
    'name' | 'firstReleaseDate' | 'igdbId',
    'asc' | 'desc',
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
    if (selectedIds.size === 0) return;
    deleteMutation.mutate(Array.from(selectedIds));
    setIsDeleteDialogOpen(false);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const { data, isLoading, isPlaceholderData } = useQuery<
    PaginatedResponse<Game>
  >({
    queryKey: ['games', page, pageSize, debouncedSearch, sortBy, sortDir],
    queryFn: () =>
      getPaginatedGames(
        page,
        Number.parseInt(pageSize, 10),
        debouncedSearch,
        sortBy,
        sortDir,
      ),
    placeholderData: (previousData) => previousData,
  });

  const totalPages = data?.meta?.total
    ? Math.ceil(data.meta.total / Number.parseInt(pageSize, 10))
    : 0;

  const paginationRange = useMemo(() => {
    if (!totalPages) return [];

    const range: (number | string)[] = [];
    const siblingCount = 1;
    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalPages) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
      return range;
    }

    const leftSiblingIndex = Math.max(page - siblingCount, 1);
    const rightSiblingIndex = Math.min(page + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      for (let i = 1; i <= leftItemCount; i++) range.push(i);
      range.push('...', totalPages);
    } else if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      range.push(1, '...');
      for (let i = totalPages - rightItemCount + 1; i <= totalPages; i++)
        range.push(i);
    } else {
      range.push(1, '...');
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) range.push(i);
      range.push('...', totalPages);
    }

    return range;
  }, [totalPages, page]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const handlePageSizeChange = (val: string | null) => {
    if (val) {
      setPageSize(val);
      setPage(1);
    }
  };

  const dataLengthZero = () => {
    return data?.data.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <IconSearch size={48} className="text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold">No games found</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">
          {search
            ? `We couldn't find any games matching "${search}".`
            : 'The library is currently empty.'}
        </p>
        {search && (
          <Button variant="link" onClick={clearSearch} className="mt-2">
            Clear search
          </Button>
        )}
      </div>
    ) : (
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
                  <Timeline2Card
                    game={game}
                    showTopBanner={false}
                    bannerColor={selectedIds.has(game.id) ? 'red' : 'none'}
                    className={cn(view === 'grid' && 'sm:w-36 sm:h-52')}
                  />
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
    <div className="flex flex-col min-h-full bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 space-y-4">
          <DashboardPageHeader title="Dashboard" icon={IconDashboard} />

          <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center gap-8">
              <div className="relative flex-1 group">
                <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Search games by title..."
                  className="pl-9 pr-9"
                  value={search}
                  onChange={handleSearchChange}
                />
                {search ? (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <IconX size={14} />
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="default"
                        className="w-40 justify-between px-4 font-normal cursor-pointer"
                      >
                        <span className="truncate">
                          {
                            SORT_OPTIONS.find((opt) => opt.value === sort)
                              ?.label
                          }
                        </span>
                        <IconSelector className="text-muted-foreground size-4 shrink-0" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent className="w-40" align="end">
                    <DropdownMenuRadioGroup
                      value={sort}
                      onValueChange={(val) => {
                        if (val !== sort) {
                          setSort(val as SortOption);
                          setPage(1);
                        }
                      }}
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <DropdownMenuRadioItem
                          key={opt.value}
                          value={opt.value}
                          className="pl-4 cursor-pointer"
                          closeOnClick={true}
                        >
                          {opt.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="default"
                        className="w-20 justify-between px-4 font-normal cursor-pointer"
                      >
                        <span>{pageSize}</span>
                        <IconSelector className="text-muted-foreground size-4 shrink-0" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent className="w-20" align="end">
                    <DropdownMenuRadioGroup
                      value={pageSize}
                      onValueChange={(val) => {
                        if (val !== pageSize) {
                          handlePageSizeChange(val);
                        }
                      }}
                    >
                      <DropdownMenuRadioItem
                        value="10"
                        className="pl-4 cursor-pointer"
                        closeOnClick={true}
                      >
                        10
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="25"
                        className="pl-4 cursor-pointer"
                        closeOnClick={true}
                      >
                        25
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="50"
                        className="pl-4 cursor-pointer"
                        closeOnClick={true}
                      >
                        50
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-row justify-between items-center gap-4">
              <div className="flex flex-row items-center gap-4">
                <div className="flex bg-muted p-1 border border-border">
                  <Button
                    variant={view === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setView('grid')}
                    title="Grid view"
                    className="cursor-pointer"
                  >
                    <IconLayoutGrid size={20} />
                  </Button>
                  <Button
                    variant={view === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setView('list')}
                    title="List view"
                    className="cursor-pointer"
                  >
                    <IconList size={20} />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
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
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
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
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    Showing{' '}
                    <span className="font-medium text-foreground">
                      {(page - 1) * Number.parseInt(pageSize, 10) + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium text-foreground">
                      {Math.min(
                        page * Number.parseInt(pageSize, 10),
                        data?.meta?.total || 0,
                      )}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-foreground">
                      {data?.meta?.total || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-xs"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="w-8 h-8 cursor-pointer"
                    >
                      <IconChevronLeft size={16} />
                    </Button>

                    <div className="flex items-center gap-1 mx-1">
                      {paginationRange.map((p, i) =>
                        p === '...' ? (
                          <span
                            key={`dots-${i + 1}`}
                            className="w-8 flex justify-center text-muted-foreground select-none"
                          >
                            ...
                          </span>
                        ) : (
                          <Button
                            key={p}
                            variant={page === p ? 'default' : 'ghost'}
                            size="icon-xs"
                            className={cn(
                              'w-8 h-8 cursor-pointer',
                              page === p && 'pointer-events-none',
                            )}
                            onClick={() => setPage(p as number)}
                          >
                            {p}
                          </Button>
                        ),
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="icon-xs"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="w-8 h-8 cursor-pointer"
                    >
                      <IconChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1">
        {isLoading && !data ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm font-medium">Loading your library...</p>
          </div>
        ) : (
          dataLengthZero()
        )}
      </div>
    </div>
  );
}
