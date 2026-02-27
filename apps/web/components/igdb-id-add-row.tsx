'use client';

import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconTrash, IconLoader } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import {
  useIgdbIdAddValidation,
  type IgdbIdAddValidationState,
} from '@/lib/hooks/use-igdb-id-add-validation';
import { IgdbAddValidationBadge } from '@/components/igdb-add-validation-badge';

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

  return (
    <div className={cn(
      'flex flex-col gap-2 p-4 border bg-card',
      isDuplicate && 'border-destructive',
    )}>
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
            {validationState.isLoading ? (
              <IconLoader
                size={16}
                className="animate-spin text-muted-foreground shrink-0"
                aria-label="Validating"
              />
            ) : null}
          </div>
          <div aria-live="polite" aria-atomic="true" className="min-h-4">
            <IgdbAddValidationBadge state={validationState} />
          </div>
        </div>

        <div className="pt-6">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            disabled={isLastRow}
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
