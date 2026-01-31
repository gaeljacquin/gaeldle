"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Game } from "@gaeldle/types/game";
import { useUser } from "@stackframe/stack";
import { CheckSquare, LayoutGrid, List, Pencil, Search, Trash2 } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from "next/image";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

type GamesMeta = {
  page: number;
  pageSize: number;
  total: number;
};

type GamesResponse = {
  success: boolean;
  data: Game[];
  meta?: GamesMeta;
  error?: string;
};

export default function DashboardView() {
  const user = useUser();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filterText, setFilterText] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const filteredGames = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    if (!query) return games;
    return games.filter((game) => game.name.toLowerCase().includes(query));
  }, [games, filterText]);

  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = total === 0 ? 0 : (page - 1) * pageSize + games.length;

  useEffect(() => {
    if (!user) {
      return;
    }

    const controller = new AbortController();

    const fetchGames = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const accessToken = await user.getAccessToken();

        if (!accessToken) {
          throw new Error("Missing access token.");
        }

        const response = await fetch(
          `/api/games?page=${page}&pageSize=${pageSize}`,
          {
            signal: controller.signal,
            cache: "no-store",
            headers: {
              "x-stack-access-token": accessToken,
            },
          }
        );

        const payload = (await response.json()) as GamesResponse;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Unable to load games.");
        }

        setGames(payload.data);
        setTotal(payload.meta?.total ?? payload.data.length);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unable to load games.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchGames();

    return () => controller.abort();
  }, [page, pageSize, user]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const handlePageChange = (nextPage: number) => {
    if (nextPage >= 1 && nextPage <= totalPages) {
      setPage(nextPage);
    }
  };

  const handleConfirmDelete = () => {
    setDeleteDialogOpen(false);
  };

  const handleToggleSelection = (gameId: number) => {
    const newSelected = new Set(selectedGames);
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId);
    } else {
      newSelected.add(gameId);
    }
    setSelectedGames(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedGames.size === filteredGames.length) {
      setSelectedGames(new Set());
    } else {
      setSelectedGames(new Set(filteredGames.map((g) => g.id)));
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(false);
    setSelectedGames(new Set());
    setSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedGames(new Set());
    }
    setSelectionMode(!selectionMode);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 3;

    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          href="#"
          isActive={page === 1}
          size="icon"
          onClick={(event) => {
            event.preventDefault();
            handlePageChange(1);
          }}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    if (page > maxVisible) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (i === 1 || i === totalPages) continue;
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            isActive={page === i}
            size="icon"
            onClick={(event) => {
              event.preventDefault();
              handlePageChange(i);
            }}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (page < totalPages - maxVisible + 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            isActive={page === totalPages}
            size="icon"
            onClick={(event) => {
              event.preventDefault();
              handlePageChange(totalPages);
            }}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const renderGrid = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: Math.min(pageSize, 10) }).map((_, index) => (
            <Card key={`grid-skeleton-${index + 1}`} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="aspect-2/3 w-full" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      );
    }

    if (filteredGames.length === 0) {
      return (
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          {filterText
            ? "No games match this filter on the current page."
            : "No games found for this page."}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {filteredGames.map((game) => {
          const gameImage = game.imageUrl || game.aiImageUrl || "";
          return (
            <Card
              key={game.id}
              className="group relative overflow-hidden transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/50"
            >
              {selectionMode && (
                <div className="absolute left-2 top-2 z-10">
                  <Checkbox
                    checked={selectedGames.has(game.id)}
                    onCheckedChange={() => handleToggleSelection(game.id)}
                    className="bg-background"
                  />
                </div>
              )}

              <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="secondary" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/cover-art?gameId=${game.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  // onClick={() => handleDeleteClick(game.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <CardContent className="p-0">
                <Link href={`/cover-art?gameId=${game.id}`} className="block">
                  <div className="relative aspect-2/3 w-full overflow-hidden bg-muted">
                    {gameImage ? (
                      <Image
                        src={gameImage}
                        alt={game.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                        fill
                        sizes="10vw"
                      />
                    ) : null}
                    <Skeleton className="absolute inset-0 -z-10" />
                  </div>
                </Link>
                <div className="p-3">
                  <h3 className="truncate text-sm font-medium text-foreground">
                    {game.name}
                  </h3>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderList = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: Math.min(pageSize, 8) }).map((_, index) => (
            <Card key={`list-skeleton-${index + 1}`}>
              <CardContent className="flex items-center gap-4 p-3">
                <Skeleton className="h-16 w-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      );
    }

    if (filteredGames.length === 0) {
      return (
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          {filterText
            ? "No games match this filter on the current page."
            : "No games found for this page."}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredGames.map((game) => {
          const gameImage = game.imageUrl || game.aiImageUrl || "";
          return (
            <Card
              key={game.id}
              className="group transition-all hover:shadow-md hover:ring-2 hover:ring-primary/50"
            >
              <CardContent className="flex items-center gap-4 p-3">
                {selectionMode && (
                  <Checkbox
                    checked={selectedGames.has(game.id)}
                    onCheckedChange={() => handleToggleSelection(game.id)}
                  />
                )}

                <Link href={`/cover-art?gameId=${game.id}`} className="flex flex-1 items-center gap-4">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-muted">
                    {gameImage ? (
                      <Image
                        src={gameImage}
                        alt={game.name}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                        fill
                        sizes="10vw"
                      />
                    ) : null}
                    <Skeleton className="absolute inset-0 -z-10" />
                  </div>
                  <h3 className="truncate text-sm font-medium text-foreground">
                    {game.name}
                  </h3>
                </Link>

                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="secondary" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/cover-art?gameId=${game.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    // onClick={() => handleDeleteClick(game.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter games..."
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Button
              variant={selectionMode ? "secondary" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Select
            </Button>

            {selectionMode && selectedGames.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete selected ({selectedGames.size})
              </Button>
            )}

            {selectionMode && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    selectedGames.size === filteredGames.length &&
                    filteredGames.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">All</span>
              </div>
            )}

            <div className="flex items-center gap-1 rounded-md border border-input p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon-sm"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? renderGrid() : renderList()}

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
            Showing {startIndex}-{endIndex} of {total} games
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  size="default"
                  onClick={(event) => {
                    event.preventDefault();
                    handlePageChange(page - 1);
                  }}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  size="default"
                  onClick={(event) => {
                    event.preventDefault();
                    handlePageChange(page + 1);
                  }}
                  className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Game</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this game? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={bulkDeleteDialogOpen}
          onOpenChange={setBulkDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Selected Games</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedGames.size} selected game
                {selectedGames.size === 1 ? "" : "s"}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
