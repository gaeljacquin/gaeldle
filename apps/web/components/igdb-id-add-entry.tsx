'use client';

import { useEffect } from 'react';
import { Button } from '@workspace/ui/button';
import {
  IconTrash,
  IconLoader,
  IconRefresh,
  IconSquareRoundedX,
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import {
  useIgdbIdAddValidation,
  type IgdbIdAddValidationState,
} from '@/lib/hooks/use-igdb-id-add-validation';
import { IgdbAddValidationBadge } from '@/components/igdb-add-validation-badge';
import { toast } from 'sonner';
import { PLACEHOLDER_IGDB_IDS } from '@workspace/shared';

export interface IgdbIdAddEntryData {
  id: string;
  igdbId: string;
}

interface IgdbIdAddEntryProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onRemove: () => void;
  isLastEntry: boolean;
  entryId: string;
  onValidationChange: (id: string, state: IgdbIdAddValidationState) => void;
  isDuplicate?: boolean;
  error?: string;
}

export function IgdbIdAddEntry({
  value,
  onChange,
  onBlur,
  onRemove,
  isLastEntry,
  entryId,
  onValidationChange,
  isDuplicate = false,
  error,
}: IgdbIdAddEntryProps) {
  const validationState = useIgdbIdAddValidation(value);

  const { isLoading, isReady, existsOnIgdb, alreadyInDb, gameName, canAdd } =
    validationState;

  useEffect(() => {
    onValidationChange(entryId, {
      isLoading,
      isReady,
      existsOnIgdb,
      alreadyInDb,
      gameName,
      canAdd,
      refetch: validationState.refetch,
      stop: validationState.stop,
    });
  }, [
    entryId,
    isLoading,
    isReady,
    existsOnIgdb,
    alreadyInDb,
    gameName,
    canAdd,
    onValidationChange,
    validationState.refetch,
    validationState.stop,
  ]);

  const hasError =
    !!error ||
    (validationState.isReady &&
      !validationState.isLoading &&
      !validationState.canAdd);

  const canSync = value.trim() !== '' && !validationState.isLoading;

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
      <div className="flex items-center gap-3 w-full">
        <div
          className={cn(
            'flex items-center flex-1 min-w-0 h-11 rounded-md border border-input bg-transparent text-sm ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            hasError && 'border-destructive focus-within:ring-destructive',
          )}
        >
          <div className="bg-muted text-muted-foreground px-3 h-full flex items-center border-r border-input text-xs font-semibold rounded-l-md select-none shrink-0">
            IGDB ID
          </div>
          <input
            id={`igdb-add-${entryId}`}
            type="number"
            min={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={`e.g. ${PLACEHOLDER_IGDB_IDS},...`}
            className="flex-1 min-w-0 h-full bg-transparent px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-invalid={hasError}
          />
        </div>
        <div className="flex items-center gap-2">
          {validationState.isLoading ? (
            <div className="relative group h-11 px-4 py-3 flex items-center justify-center border border-border bg-muted/20">
              <IconLoader
                size={20}
                className="animate-spin text-primary group-hover:opacity-0 transition-opacity"
                aria-label="Validating"
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
            onClick={onRemove}
            disabled={isLastEntry}
            aria-label="Remove entry"
            title="Remove entry"
            className="text-muted-foreground hover:text-destructive cursor-pointer h-11 px-4 py-1 rounded-none flex items-center justify-center shrink-0"
          >
            <IconTrash size={20} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div
        className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 select-all truncate"
        title={entryId}
      >
        Entry ID: {entryId}
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <IconSquareRoundedX size={12} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {validationState.isReady && !error && (
        <div aria-live="polite" aria-atomic="true">
          <IgdbAddValidationBadge state={validationState} />
        </div>
      )}
    </div>
  );
}
