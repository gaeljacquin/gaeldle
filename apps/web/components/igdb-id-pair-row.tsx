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
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import type { ReplaceGameValidationState } from '@/lib/hooks/use-replace-game-validation';

export interface IgdbIdPairRowData {
  id: string;
  current: string;
  replacement: string;
}

interface IgdbIdPairRowProps {
  row: IgdbIdPairRowData;
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
}: Readonly<{ state: ReplaceGameValidationState; igdbId: string }>) {
  if (!state.isReady) return null;

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

function ReplacementBadge({
  state,
}: Readonly<{ state: ReplaceGameValidationState }>) {
  if (!state.isReady) return null;

  // Current not in DB — skip IGDB lookup, show nothing under replacement
  if (state.currentExistsInDb === false) return null;

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

export function IgdbIdPairRow({
  row,
  validationState,
  onCurrentChange,
  onReplacementChange,
  onRemove,
  canRemove,
  isDuplicate = false,
}: Readonly<IgdbIdPairRowProps>) {
  const currentHasError =
    validationState.isReady &&
    !validationState.isLoading &&
    validationState.currentExistsInDb === false;

  const replacementHasError =
    validationState.isReady &&
    !validationState.isLoading &&
    validationState.currentExistsInDb === true &&
    !validationState.canApply;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4 border bg-card',
        isDuplicate && 'border-destructive',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Current IGDB ID */}
        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor={`current-${row.id}`} className="text-xs">
            Current IGDB ID
          </Label>
          <Input
            id={`current-${row.id}`}
            type="number"
            min={1}
            value={row.current}
            onChange={(e) => onCurrentChange(row.id, e.target.value)}
            placeholder="e.g. 132181"
            className={cn(
              'font-mono',
              currentHasError &&
                'border-destructive focus-visible:ring-destructive',
            )}
            aria-invalid={currentHasError}
          />
          <div aria-live="polite" aria-atomic="true" className="min-h-4">
            <CurrentBadge state={validationState} igdbId={row.current} />
          </div>
        </div>

        {/* Arrow / spinner separator */}
        <div className="pt-7 text-muted-foreground shrink-0">
          {validationState.isLoading ? (
            <IconLoader
              size={16}
              className="animate-spin"
              aria-label="Validating"
            />
          ) : (
            <IconArrowRight size={16} aria-hidden="true" />
          )}
        </div>

        {/* Replacement IGDB ID */}
        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor={`replacement-${row.id}`} className="text-xs">
            Replacement IGDB ID
          </Label>
          <Input
            id={`replacement-${row.id}`}
            type="number"
            min={1}
            value={row.replacement}
            onChange={(e) => onReplacementChange(row.id, e.target.value)}
            placeholder="e.g. 2"
            className={cn(
              'font-mono',
              replacementHasError &&
                'border-destructive focus-visible:ring-destructive',
            )}
            aria-invalid={replacementHasError}
          />
          <div aria-live="polite" aria-atomic="true" className="min-h-4">
            <ReplacementBadge state={validationState} />
          </div>
        </div>

        {/* Remove button */}
        <div className="pt-6">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(row.id)}
            disabled={!canRemove}
            aria-label="Remove row"
            className="text-muted-foreground hover:text-destructive cursor-pointer"
          >
            <IconTrash size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
