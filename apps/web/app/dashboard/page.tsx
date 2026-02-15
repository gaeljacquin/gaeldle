'use client';

import { useState, useMemo, ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllGames, deleteBulkGames } from '@/lib/services/game.service';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/table';
import { Checkbox } from '@/components/checkbox';
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
import {
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconX,
  IconTrash,
  IconSelector,
  IconCaretUpFilled,
  IconCaretDownFilled,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Game } from '@gaeldle/api-contract';
import Link from 'next/link';
import Image from 'next/image';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  SortingState,
  Row,
  Table as TanStackTable,
} from '@tanstack/react-table';
import { toast } from 'sonner';

interface GameCellProps {
  row: Row<Game>;
}

function GameCell({ row }: Readonly<GameCellProps>) {
  const game = row.original;
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-12 overflow-hidden border border-border bg-muted shrink-0">
        {game.imageUrl ? (
          <Image
            src={game.imageUrl}
            alt={game.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[8px] uppercase text-muted-foreground text-center p-1 leading-tight">
            No cover
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <Link
          href={`/dashboard/games/${game.igdbId}`}
          className="font-bold hover:text-primary transition-colors truncate"
        >
          {game.name}
        </Link>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          ID: {game.igdbId}
        </span>
      </div>
    </div>
  );
}

function DateCell({ row }: Readonly<GameCellProps>) {
  const date = row.original.firstReleaseDate;
  if (!date) return <span className="text-muted-foreground text-xs italic">Unknown</span>;
  return (
    <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">
      {new Date(date * 1000).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}
    </span>
  );
}

function SummaryCell({ row }: Readonly<GameCellProps>) {
  const summary = row.original.summary;
  return (
    <p className="text-xs text-muted-foreground line-clamp-2 max-w-md">
      {summary || 'No description available.'}
    </p>
  );
}

interface SelectionHeaderProps {
  table: TanStackTable<Game>;
}

function SelectionHeader({ table }: Readonly<SelectionHeaderProps>) {
  return (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      onCheckedChange={(checked: boolean) => table.toggleAllPageRowsSelected(checked)}
      aria-label="Select all"
    />
  );
}

function SelectionCell({ row }: Readonly<GameCellProps>) {
  return (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(checked: boolean) => row.toggleSelected(checked)}
      aria-label="Select row"
    />
  );
}

interface GameTableProps {
  isLoading: boolean;
  data: Game[];
  columns: ColumnDef<Game>[];
  search: string;
  setSearch: (s: string) => void;
  rowSelection: RowSelectionState;
  setRowSelection: (s: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => void;
  sorting: SortingState;
  setSorting: (s: SortingState | ((old: SortingState) => SortingState)) => void;
  onDeleteClick: () => void;
  deleteIsPending: boolean;
}

function GameTable({
  isLoading,
  data,
  columns,
  search,
  setSearch,
  rowSelection,
  setRowSelection,
  sorting,
  setSorting,
  onDeleteClick,
  deleteIsPending,
}: Readonly<GameTableProps>) {
  'use no memo';
  const getRowId = useMemo(() => (row: Game) => row.id.toString(), []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setSearch,
    onSortingChange: setSorting,
    state: {
      rowSelection,
      globalFilter: search,
      sorting,
    },
    getRowId,
    autoResetPageIndex: true,
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalPages = table.getPageCount();
  const page = pageIndex + 1;
  const selectedCount = Object.keys(rowSelection).length;

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
      table.setPageSize(Number.parseInt(val, 10));
    }
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm font-medium">Loading your library...</p>
      </div>
    );
  }

  if (data.length === 0 || table.getFilteredRowModel().rows.length === 0) {
    return (
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
    );
  }

  const totalRows = table.getFilteredRowModel().rows.length;

  const sortDirComp = (sortDir: string | boolean) => {
    if (sortDir === 'asc') {
      return <IconCaretUpFilled size={12} className="text-primary" />;
    }

    if (sortDir === 'desc') {
      return <IconCaretDownFilled size={12} className="text-primary" />;
    }

    return <IconSelector size={14} />;
  };

  return (
    <>
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 space-y-4">
          <div className="flex flex-col items-start gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage and explore all games in the database.
            </p>
          </div>

          <div className="flex flex-row justify-between items-start">
            <div className="relative w-1/2 group">
              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
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
              {selectedCount > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRowSelection({})}
                    className="text-xs font-normal hover:bg-transparent hover:text-primary p-0 h-auto"
                  >
                    Deselect all
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDeleteClick}
                    className="gap-2"
                    disabled={deleteIsPending}
                  >
                    {deleteIsPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <IconTrash size={16} />
                    )}
                    Delete {selectedCount}
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows per page:</span>
                <Select
                  value={table.getState().pagination.pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-20 h-8">
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
      </div>

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="space-y-4">
          <div className="rounded-none border border-border bg-card">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const isSortable = header.column.getCanSort();
                      const sortDir = header.column.getIsSorted();

                      return (
                        <TableHead
                          key={header.id}
                          className={cn(isSortable && 'cursor-pointer select-none')}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-2">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                            {isSortable && (
                              <div className="text-muted-foreground/50">
                                {sortDirComp(sortDir)}
                              </div>
                            )}
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
              <p className="text-xs text-muted-foreground order-2 sm:order-1">
                Showing <span className="font-medium">{pageIndex * pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min((pageIndex + 1) * pageSize, totalRows)}
                </span>{' '}
                of <span className="font-medium">{totalRows}</span> games
              </p>

              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
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
                        onClick={() => table.setPageIndex((p as number) - 1)}
                      >
                        {p}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                >
                  <IconChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: allGames, isLoading } = useQuery({
    queryKey: ['games', 'all'],
    queryFn: () => getAllGames(),
  });

  const selectedCount = Object.keys(rowSelection).length;

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => deleteBulkGames(ids),
    onSuccess: () => {
      toast.success(`${selectedCount} games deleted successfully`);
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
    onError: (error) => {
      toast.error('Failed to delete games');
      console.error(error);
    },
  });

  const columns = useMemo<ColumnDef<Game>[]>(() => [
    {
      id: 'select',
      header: SelectionHeader,
      cell: SelectionCell,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Game',
      cell: GameCell,
      enableSorting: true,
    },
    {
      accessorKey: 'firstReleaseDate',
      header: 'Release Date',
      cell: DateCell,
      enableSorting: true,
    },
    {
      accessorKey: 'summary',
      header: 'Summary',
      cell: SummaryCell,
      enableSorting: false,
    },
  ], []);

  const tableData = useMemo(() => allGames || [], [allGames]);

  const handleBulkDelete = () => {
    const ids = Object.keys(rowSelection).map((id) => Number.parseInt(id, 10));
    deleteMutation.mutate(ids);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="flex flex-col min-h-full bg-background">
      <GameTable
        isLoading={isLoading}
        data={tableData}
        columns={columns}
        search={search}
        setSearch={setSearch}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        sorting={sorting}
        setSorting={setSorting}
        onDeleteClick={() => setIsDeleteDialogOpen(true)}
        deleteIsPending={deleteMutation.isPending}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCount} selected games from the database.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleBulkDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
