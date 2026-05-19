'use client';

import { useEffect } from 'react';
import { Input } from '@workspace/ui/input';
import { Button } from '@workspace/ui/button';
import { Label } from '@workspace/ui/label';
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

export interface IgdbIdAddRowData {
  id: string;
  igdbId: string;
}

interface IgdbIdAddRowProps {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  isLastRow: boolean;
  rowId: string;
  onValidationChange: (id: string, state: IgdbIdAddValidationState) => void;
  isDuplicate?: boolean;
}

export function IgdbIdAddRow({
  value,
  onChange,
  onRemove,
  isLastRow,
  rowId,
  onValidationChange,
  isDuplicate = false,
}: Readonly<IgdbIdAddRowProps>) {
  const validationState = useIgdbIdAddValidation(value);

  useEffect(() => {
    onValidationChange(rowId, validationState);
  }, [rowId, validationState, onValidationChange]);

  const hasError =
    validationState.isReady &&
    !validationState.isLoading &&
    !validationState.canAdd;

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
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor={`igdb-add-${rowId}`} className="text-xs">
            IGDB ID
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id={`igdb-add-${rowId}`}
              type="number"
              min={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. 1942"
              className={cn(
                'font-mono',
                hasError && 'border-destructive focus-visible:ring-destructive',
              )}
              aria-invalid={hasError}
            />
          </div>
          <div aria-live="polite" aria-atomic="true" className="min-h-4">
            <IgdbAddValidationBadge state={validationState} />
          </div>
        </div>

        <div className="pt-6 flex items-center gap-1">
          {validationState.isLoading ? (
            <div className="relative group w-8 h-8 flex items-center justify-center">
              <IconLoader
                size={16}
                className="animate-spin text-primary group-hover:opacity-0 transition-opacity"
                aria-label="Validating"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleStop}
                aria-label="Stop syncing"
                title="Stop syncing"
                className="absolute inset-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity cursor-pointer"
              >
                <IconSquareRoundedX size={16} aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => validationState.refetch()}
              disabled={!canSync}
              aria-label="Sync IGDB info"
              title="Sync IGDB info"
              className="text-muted-foreground hover:text-primary cursor-pointer"
            >
              <IconRefresh size={14} aria-hidden="true" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            disabled={isLastRow}
            aria-label="Remove row"
            title="Remove row"
            className="text-muted-foreground hover:text-destructive cursor-pointer"
          >
            <IconTrash size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
