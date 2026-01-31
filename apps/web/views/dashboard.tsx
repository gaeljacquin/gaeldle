"use client";

import { useEffect, useMemo, useState } from "react";
import type { Game } from "@gaeldle/types/game";
import { useUser } from "@stackframe/stack";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Menu,
  Search,
  SlidersHorizontal,
} from "lucide-react";

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

const navItems = [
  { label: "Dashboard", icon: LayoutGrid, active: true },
  { label: "Analytics", icon: SlidersHorizontal },
  { label: "Reports", icon: SlidersHorizontal },
  { label: "Settings", icon: SlidersHorizontal },
];

const formatReleaseYear = (timestamp: number | null) => {
  if (!timestamp) return "—";
  const year = new Date(timestamp * 1000).getFullYear();
  return Number.isFinite(year) ? String(year) : "—";
};

const getInitials = (value?: string | null) => {
  if (!value) return "U";
  const parts = value.trim().split(" ");
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
  return letters.join("") || "U";
};

export default function DashboardView() {
  const user = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filterQuery, setFilterQuery] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    const controller = new AbortController();

    const fetchGames = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const authJson = await user.getAuthJson();
        const accessToken = authJson.accessToken;

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

  return (
    <div className="min-h-full bg-gradient-to-br from-[#f8f3ea] via-[#f5f5f0] to-[#ecf4f7] px-4 py-6 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl gap-6">
        <aside
          className={`flex flex-col rounded-3xl border border-black/5 bg-white/80 p-4 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.7)] backdrop-blur transition-all duration-300 ${
            isSidebarOpen ? "w-64" : "w-20"
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4 text-slate-700" />
            </button>
            {isSidebarOpen && (
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Gaeldle
              </div>
            )}
          </div>

          <nav className="mt-8 flex flex-1 flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  item.active
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                    : "text-slate-600 hover:bg-slate-900/5"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                {getInitials(user?.displayName || user?.primaryEmail)}
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">
                    {user?.displayName || "Signed in"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {user?.primaryEmail || "Active session"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="flex flex-1 flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-black/5 bg-white/80 px-6 py-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.6)] backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Dashboard
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Game Library Overview
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 shadow-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  className="w-40 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder="Filter games..."
                  value={filterQuery}
                  onChange={(event) => setFilterQuery(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Rows
                </span>
                <select
                  className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </header>

          <section className="rounded-3xl border border-black/5 bg-white/80 p-6 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.6)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  All Games
                </h2>
                <p className="text-sm text-slate-500">
                  {total.toLocaleString()} total entries
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <span>Page</span>
                <span className="rounded-full border border-black/5 bg-white px-3 py-1 text-slate-700">
                  {page} / {totalPages}
                </span>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-black/5">
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                <span>Game</span>
                <span>Release</span>
                <span>Status</span>
              </div>

              <div className="divide-y divide-black/5 bg-white">
                {isLoading && (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    Loading games...
                  </div>
                )}
                {!isLoading && error && (
                  <div className="px-4 py-6 text-sm text-rose-500">
                    {error}
                  </div>
                )}
                {!isLoading && !error && games.length === 0 && (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    No games found for this page.
                  </div>
                )}
                {!isLoading &&
                  !error &&
                  games.map((game) => (
                    <div
                      key={game.id}
                      className="grid grid-cols-[2fr_1fr_1fr] gap-4 px-4 py-4 text-sm text-slate-700"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {game.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          IGDB #{game.igdbId}
                        </span>
                      </div>
                      <span className="text-slate-600">
                        {formatReleaseYear(game.firstReleaseDate)}
                      </span>
                      <span className="inline-flex w-fit items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                        Active
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Showing {games.length} of {total.toLocaleString()} games
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  className="flex items-center gap-2 rounded-full border border-black/5 bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
