'use client';

import { Input } from '@workspace/ui/input';
import { Button } from '@workspace/ui/button';
import { Label } from '@workspace/ui/label';
import {
  IconTrash,
  IconArrowRight,
  IconCircleCheck,
  IconCircleX,
  IconLoader,
  IconRefresh,
  IconSquareRoundedX,
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import type { ReplaceGameValidationState } from '@/lib/hooks/use-replace-game-validation';
import { toast } from 'sonner';

export interface IgdbIdRowPairData {
  id: string;
  current: string;
  replacement: string;
}

interface IgdbIdRowPairProps {
  row: IgdbIdRowPairData;
  validationState: ReplaceGameValidationState;
  onCurrentChange: (id: string, value: string) => void;
  onReplacementChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  isDuplicate?: boolean;
}

function CurrentBadge({
  state,
  igdbId,
}: {
  state: ReplaceGameValidationState;
  igdbId: string;
}) {
  if (!state.isReady && !state.isLoading) {
    return null;
  }

  if (state.currentExistsInDb === false) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <IconCircleX size={12} aria-hidden="true" />
        <span>
          Not found &mdash; <span className="font-mono">{igdbId}</span>
        </span>
      </div>
    );
  }

  if (state.currentExistsInDb === true) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <IconCircleCheck size={12} aria-hidden="true" />
        <span>
          Found
          {state.currentGameName ? (
            <>
              {' '}
              &mdash;{' '}
              <span className="font-medium">{state.currentGameName}</span>
            </>
          ) : null}
        </span>
      </div>
    );
  }

  return null;
}

function ReplacementBadge({ state }: { state: ReplaceGameValidationState }) {
  if (!state.isReady) {
    return null;
  }

  if (state.currentExistsInDb === false) {
    return null;
  }

  if (state.sameIds) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <IconCircleX size={12} aria-hidden="true" />
        <span>IDs must be different</span>
      </div>
    );
  }

  if (state.replacementAlreadyInDb) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <IconCircleX size={12} aria-hidden="true" />
        <span>Already exists in database</span>
      </div>
    );
  }

  if (state.replacementExistsOnIgdb === false) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <IconCircleX size={12} aria-hidden="true" />
        <span>Not found on IGDB</span>
      </div>
    );
  }

  if (state.canApply) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <IconCircleCheck size={12} aria-hidden="true" />
        <span>
          Valid
          {state.replacementGameName ? (
            <>
              {' '}
              &mdash;{' '}
              <span className="font-medium">{state.replacementGameName}</span>
            </>
          ) : null}
        </span>
      </div>
    );
  }

  return null;
}

export function IgdbIdRowPair({
  row,
  validationState,
  onCurrentChange,
  onReplacementChange,
  onRemove,
  canRemove,
  isDuplicate = false,
}: IgdbIdRowPairProps) {
  const currentHasError =
    validationState.isReady &&
    !validationState.isLoading &&
    validationState.currentExistsInDb === false;
  const replacementHasError =
    validationState.isReady &&
    !validationState.isLoading &&
    validationState.currentExistsInDb === true &&
    !validationState.canApply;
  const canSync = row.replacement.trim() !== '' && !validationState.isLoading;

  const handleStop = () => {
    validationState.stop();
    toast.info('Syncing stopped');
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4 border bg-card',
        isDuplicate && 'border-destructive',
      )}
    >
      <div className="flex items-center gap-6">
        {/* Current IGDB ID */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <Label htmlFor={`current-${row.id}`} className="text-xs">
            Current IGDB ID
          </Label>
          <div className="relative">
            <Input
              id={`current-${row.id}`}
              type="number"
              min={1}
              value={row.current}
              onChange={(e) => onCurrentChange(row.id, e.target.value)}
              placeholder="e.g. 132181"
              className={cn(
                'font-mono pr-8 h-11 w-48',
                currentHasError &&
                  'border-destructive focus-visible:ring-destructive',
              )}
              aria-invalid={currentHasError}
            />
            {validationState.isLoading && !validationState.isReady && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <IconLoader
                  size={16}
                  className="animate-spin text-muted-foreground"
                  aria-label="Validating current ID"
                />
              </div>
            )}
          </div>
        </div>

        {/* Arrow separator */}
        <div className="pt-6 text-muted-foreground shrink-0">
          <IconArrowRight size={20} aria-hidden="true" />
        </div>

        {/* Replacement IGDB ID */}
        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor={`replacement-${row.id}`} className="text-xs">
            Replacement IGDB ID
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id={`replacement-${row.id}`}
              type="number"
              min={1}
              value={row.replacement}
              onChange={(e) => onReplacementChange(row.id, e.target.value)}
              placeholder="e.g. 2"
              className={cn(
                'font-mono h-11 w-48',
                replacementHasError &&
                  'border-destructive focus-visible:ring-destructive',
              )}
              aria-invalid={replacementHasError}
            />
            {/* Buttons */}
            <div className="flex items-center gap-2">
              {validationState.isLoading && validationState.isReady ? (
                <div className="relative group h-11 px-4 py-3 flex items-center justify-center border border-border bg-muted/20 shrink-0">
                  <IconLoader
                    size={20}
                    className="animate-spin text-primary group-hover:opacity-0 transition-opacity"
                    aria-label="Validating replacement"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleStop}
                    aria-label="Stop syncing"
                    title="Stop syncing"
                    className="absolute inset-0 size-full opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity cursor-pointer rounded-none"
                  >
                    <IconSquareRoundedX size={20} aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => validationState.refetch()}
                  disabled={!canSync}
                  aria-label="Sync IGDB info"
                  title="Sync IGDB info"
                  className="text-muted-foreground hover:text-primary cursor-pointer h-11 px-4 py-1 rounded-none flex items-center justify-center shrink-0"
                >
                  <IconRefresh size={20} aria-hidden="true" />
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onRemove(row.id)}
                disabled={!canRemove}
                aria-label="Remove row"
                title="Remove row"
                className="text-muted-foreground hover:text-destructive cursor-pointer h-11 px-4 py-1 rounded-none flex items-center justify-center shrink-0"
              >
                <IconTrash size={20} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-40 min-h-4">
        <div aria-live="polite" aria-atomic="true" className="flex-1">
          <CurrentBadge state={validationState} igdbId={row.current} />
        </div>
        <div aria-live="polite" aria-atomic="true" className="flex-1">
          <ReplacementBadge state={validationState} />
        </div>
      </div>
    </div>
  );
}
