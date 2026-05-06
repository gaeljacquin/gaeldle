'use client';

import { useUser } from '@stackframe/stack';
import {
  IconZoomScan,
  IconPlayerPlay,
  IconLoader,
  IconRefresh,
  IconCircleCheck,
  IconCircleX,
} from '@tabler/icons-react';
import { DISCOVER_GAMES_MAX } from '@workspace/constants';
import { DashboardPageHeader } from '@/components/dashboard-header';
import { Button } from '@workspace/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@workspace/ui/card';
import { DiscoveredGameCard } from '@/components/discovered-game-card';
import { useDiscoverGames } from '@/lib/hooks/use-discover-games';
import type {
  DiscoverCandidate,
  DiscoverApplyResult,
} from '@workspace/api-contract';

function ApplyResultsRow({
  result,
}: Readonly<{ result: DiscoverApplyResult }>) {
  if (result.status === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-destructive">
        <IconCircleX size={14} aria-hidden="true" />
        <span className="text-xs font-medium">
          {result.name ?? `IGDB #${result.igdbId}`}
        </span>
        {result.error ? (
          <span className="text-xs text-muted-foreground">
            — {result.error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-green-600">
      <IconCircleCheck size={14} aria-hidden="true" />
      <span className="text-xs font-medium">
        {result.name ?? `IGDB #${result.igdbId}`}
      </span>
    </div>
  );
}

interface IdlePhaseProps {
  countInput: number;
  setCountInput: (n: number) => void;
  onScan: () => void;
  isScanning: boolean;
}

function IdlePhase({
  countInput,
  setCountInput,
  onScan,
  isScanning,
}: Readonly<IdlePhaseProps>) {
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-3">
        <input
          id="discover-count"
          type="number"
          min={1}
          max={DISCOVER_GAMES_MAX}
          value={countInput}
          onChange={(e) => {
            const val = Number.parseInt(e.target.value, 10);
            if (!Number.isNaN(val)) {
              setCountInput(Math.min(Math.max(1, val), DISCOVER_GAMES_MAX));
            }
          }}
          className="w-20 border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
          aria-label={`Number of games to discover (1–${DISCOVER_GAMES_MAX})`}
        />
        <Button
          type="button"
          onClick={onScan}
          disabled={isScanning}
          className="flex items-center gap-2 cursor-pointer"
        >
          {isScanning ? (
            <IconLoader size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <IconPlayerPlay size={16} aria-hidden="true" />
          )}
          Submit
        </Button>
      </div>
    </div>
  );
}

interface ResultsControlsProps {
  selectedCount: number;
  totalCount: number;
  newCount: number;
  canApply: boolean;
  isApplying: boolean;
  isScanning: boolean;
  onSelectAllNew: () => void;
  onDeselectAll: () => void;
  onApply: () => void;
  onScanAgain: () => void;
}

function ResultsControls({
  selectedCount,
  newCount,
  canApply,
  isApplying,
  isScanning,
  onSelectAllNew,
  onDeselectAll,
  onApply,
  onScanAgain,
}: Readonly<ResultsControlsProps>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onSelectAllNew}
        disabled={newCount === 0 || isApplying}
        className="cursor-pointer"
      >
        Select All New ({newCount})
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onDeselectAll}
        disabled={selectedCount === 0 || isApplying}
        className="cursor-pointer"
      >
        Deselect All
      </Button>
      <Button
        type="button"
        onClick={onApply}
        disabled={!canApply}
        className="flex items-center gap-2 cursor-pointer"
      >
        {isApplying ? (
          <IconLoader size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <IconPlayerPlay size={16} aria-hidden="true" />
        )}
        Add Selected ({selectedCount})
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onScanAgain}
        disabled={isScanning || isApplying}
        className="flex items-center gap-1.5 cursor-pointer"
      >
        <IconRefresh size={14} aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}

export function DiscoverGames() {
  useUser({ or: 'redirect' });

  const {
    scanMutation,
    candidates,
    scanEventId,
    handleScan,
    selectedIds,
    appliedIds,
    toggleSelect,
    selectAllNew,
    deselectAll,
    applyMutation,
    applyResults,
    handleApply,
    canApply,
    countInput,
    setCountInput,
  } = useDiscoverGames();

  const isScanning = scanMutation.isPending;
  const isApplying = applyMutation.isPending;
  const hasResults = candidates.length > 0 && scanEventId !== null;

  const newCount = candidates.filter(
    (c) => !c.isAlreadyAdded && !appliedIds.has(c.igdbId),
  ).length;

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Sticky header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <DashboardPageHeader
            title="Discover Games"
            description="Query IGDB for new titles and add your picks."
            icon={IconZoomScan}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-2xl space-y-6">
          {hasResults ? (
            <>
              {/* Summary + controls card */}
              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                  <CardDescription className="mt-1">
                    {candidates.length} candidate
                    {candidates.length === 1 ? '' : 's'} returned &mdash;{' '}
                    {candidates.filter((c) => c.isAlreadyAdded).length} already
                    in library
                    {appliedIds.size > 0
                      ? `, ${appliedIds.size} just added`
                      : null}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ResultsControls
                    selectedCount={selectedIds.size}
                    totalCount={candidates.length}
                    newCount={newCount}
                    canApply={canApply}
                    isApplying={isApplying}
                    isScanning={isScanning}
                    onSelectAllNew={() =>
                      selectAllNew(candidates as DiscoverCandidate[])
                    }
                    onDeselectAll={deselectAll}
                    onApply={handleApply}
                    onScanAgain={handleScan}
                  />

                  {/* Card grid */}
                  <div
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
                    aria-live="polite"
                  >
                    {candidates.map((candidate) => (
                      <DiscoveredGameCard
                        key={candidate.igdbId}
                        igdbId={candidate.igdbId}
                        name={candidate.name}
                        firstReleaseDate={candidate.firstReleaseDate}
                        coverUrl={candidate.coverUrl}
                        isSelected={selectedIds.has(candidate.igdbId)}
                        isAlreadyAdded={candidate.isAlreadyAdded}
                        isApplied={appliedIds.has(candidate.igdbId)}
                        isDisabled={isApplying}
                        onToggle={toggleSelect}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Post-apply results summary */}
              {applyResults ? (
                <Card aria-live="polite" aria-label="Apply results">
                  <CardHeader>
                    <CardTitle>Results</CardTitle>
                    <CardDescription className="mt-1">
                      {applyResults.filter((r) => r.status !== 'error').length}{' '}
                      games added,{' '}
                      {applyResults.filter((r) => r.status === 'error').length}{' '}
                      error(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {applyResults.map((result) => (
                      <ApplyResultsRow key={result.igdbId} result={result} />
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Discover</CardTitle>
                <CardDescription className="mt-1">
                  Up to {DISCOVER_GAMES_MAX} games.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IdlePhase
                  countInput={countInput}
                  setCountInput={setCountInput}
                  onScan={handleScan}
                  isScanning={isScanning}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
