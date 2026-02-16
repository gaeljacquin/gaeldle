'use client';

import { useState, useMemo, ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPaginatedGames, deleteBulkGames } from '@/lib/services/game.service';
import { Timeline2Card } from '@/components/timeline-2-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Game } from '@gaeldle/api-contract';
import Link from 'next/link';
import { toast } from 'sonner';

export default function Dashboard() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('10');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const debouncedSearch = useDebounce(search, 500);

  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  if (debouncedSearch !== prevSearch) {
    setPrevSearch(debouncedSearch);
    setPage(1);
  }

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => deleteBulkGames(ids),
    onSuccess: (success) => {
      if (success) {
        const successMessage = `${selectedIds.size} ${selectedIds.size === 1 ? 'game': 'games'} deleted successfully`;
        queryClient.invalidateQueries({ queryKey: ['games'] });
        toast.success(successMessage);
        setSelectedIds(new Set());
        setIsMultiSelect(false);
      } else {
        toast.error('Failed to delete games');
      }
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

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['games', page, pageSize, debouncedSearch],
    queryFn: () => getPaginatedGames(page, Number.parseInt(pageSize, 10), debouncedSearch),
    placeholderData: (previousData) => previousData,
  });

  const totalPages = data?.meta?.total ? Math.ceil(data.meta.total / Number.parseInt(pageSize, 10)) : 0;

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
      for (let i = totalPages - rightItemCount + 1; i <= totalPages; i++) range.push(i);
    } else {
      range.push(1, '...');
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) range.push(i);
      range.push('...', totalPages);
    }

    return range;
  }, [totalPages, page]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const clearSearch = () => {
    setSearch('');
  };

  const handlePageSizeChange = (val: string | null) => {
    if (val) {
      setPageSize(val);
      setPage(1);
    }
  };

  const dataLengthZero = () => {
    return (
      data?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <IconSearch size={48} className="text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold">No games found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            {search
              ? `We couldn't find any games matching "${search}".`
              : "The library is currently empty."}
          </p>
          {search && (
            <Button
              variant="link"
              onClick={clearSearch}
              className="mt-2"
            >
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
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 justify-items-center'
                : 'grid-cols-1'
            )}
          >
            {data?.data.map((game: Game) => (
              <div
                key={game.id}
                className={cn(
                  'transition-opacity duration-200 relative group/game',
                  isPlaceholderData && 'opacity-50',
                  view === 'list' &&
                    'flex gap-6 p-4 border border-border bg-card hover:bg-accent/50 transition-colors'
                )}
              >
                {isMultiSelect && (
                  <div className="absolute top-2 right-2 z-20">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(game.id)}
                      onChange={() => toggleSelect(game.id)}
                      className="w-5 h-5 rounded border-primary bg-background text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                  </div>
                )}
                <Link
                  href={isMultiSelect ? '#' : `/dashboard/games/${game.igdbId}`}
                  onClick={(e) => {
                    if (isMultiSelect) {
                      e.preventDefault();
                      toggleSelect(game.id);
                    }
                  }}
                  className={cn(view === 'grid' ? 'block hover:scale-105 transition-transform' : 'shrink-0')}
                >
                  <Timeline2Card
                    game={game}
                    showDate={false}
                  />
                </Link>
                {view === 'list' && (
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <Link
                      href={isMultiSelect ? '#' : `/dashboard/games/${game.igdbId}`}
                      onClick={(e) => {
                        if (isMultiSelect) {
                          e.preventDefault();
                          toggleSelect(game.id);
                        }
                      }}
                      className="hover:text-primary transition-colors"
                    >
                      <h3 className="text-xl font-bold truncate">{game.name}</h3>
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 mb-3">
                      {game.firstReleaseDate && (
                        <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">
                          {new Date(game.firstReleaseDate * 1000).toLocaleDateString()}
                        </span>
                      )}
                      {!!(game.igdbId) && (
                        <span className="text-[10px] uppercase tracking-wider">
                          IGDB ID: {game.igdbId}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {game.summary || 'No description available for this game.'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-8 pb-12">
              <p className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing <span className="font-medium">{(page - 1) * Number.parseInt(pageSize, 10) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * Number.parseInt(pageSize, 10), data?.meta?.total || 0)}
                </span>{' '}
                of <span className="font-medium">{data?.meta?.total}</span> games
              </p>

              <div className="flex items-center gap-1 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
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
                        className={cn('w-8 h-8', page === p && 'pointer-events-none')}
                        onClick={() => setPage(p as number)}
                      >
                        {p}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <IconChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 space-y-4">
          <div className="flex flex-col items-start gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage and explore games.
            </p>
          </div>

          <div className="flex flex-row justify-between items-start">
            <div className="relative w-1/2 group">
              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search games by name..."
                className="pl-9 pr-9"
                value={search}
                onChange={handleSearchChange}
              />
              {search ? (
                <button
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  title="Clear search"
                >
                  <IconX size={14} />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isMultiSelect && (
                  <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-4 duration-300">
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={selectedIds.size === 0 || deleteMutation.isPending}
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className={cn(
                          "h-8",
                          (selectedIds.size === 0 || deleteMutation.isPending) ? 'cursor-not-allowed' : 'cursor-pointer'
                        )}
                      >
                        <IconTrash size={16} className="mr-2" />
                        Delete ({selectedIds.size})
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {selectedIds.size}{' '}
                            {selectedIds.size === 1 ? 'game' : 'games'} from your library.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            className="cursor-pointer"
                          >
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
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      disabled={selectedIds.size === 0}
                      className={cn(
                        "h-8",
                        (selectedIds.size === 0 || deleteMutation.isPending) ? 'cursor-not-allowed' : 'cursor-pointer'
                      )}
                    >
                      Clear
                    </Button>
                  </div>
                )}

                <Button
                  variant={isMultiSelect ? 'default' : 'outline'}
                  size="icon-lg"
                  onClick={() => {
                    setIsMultiSelect(!isMultiSelect);
                    if (isMultiSelect) clearSelection();
                  }}
                  title="Multi-select"
                  className={cn(
                    "cursor-pointer",
                    isMultiSelect && "bg-primary text-primary-foreground"
                  )}
                >
                  <IconChecklist size={16} />
                </Button>

                <div className="flex bg-muted p-1 border border-border">
                  <Button
                    variant={view === 'grid' ? 'default' : 'ghost'}
                    size="icon-xs"
                    onClick={() => setView('grid')}
                    title="Grid view"
                  >
                    <IconLayoutGrid size={16} />
                  </Button>
                  <Button
                    variant={view === 'list' ? 'default' : 'ghost'}
                    size="icon-xs"
                    onClick={() => setView('list')}
                    title="List view"
                  >
                    <IconList size={16} />
                  </Button>
                </div>
              </div>

              <Select value={pageSize} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
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
        ) : dataLengthZero()}
      </div>
    </div>
  );
}
