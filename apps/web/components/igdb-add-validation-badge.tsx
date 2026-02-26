'use client';

import { IconCircleCheck, IconCircleX } from '@tabler/icons-react';
import type { IgdbIdAddValidationState } from '@/lib/hooks/use-igdb-id-add-validation';

interface IgdbAddValidationBadgeProps {
  state: IgdbIdAddValidationState;
}

export function IgdbAddValidationBadge({
  state,
}: Readonly<IgdbAddValidationBadgeProps>) {
  if (!state.isReady) return null;

  if (state.alreadyInDb) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <IconCircleX size={12} aria-hidden="true" />
        <span>Already exists in database</span>
      </div>
    );
  }

  if (state.existsOnIgdb === false) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <IconCircleX size={12} aria-hidden="true" />
        <span>Not found on IGDB</span>
      </div>
    );
  }

  if (state.canAdd) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <IconCircleCheck size={12} aria-hidden="true" />
        <span>
          Found
          {state.gameName ? (
            <>
              {' '}
              &mdash;{' '}
              <span className="font-medium">{state.gameName}</span>
            </>
          ) : null}
        </span>
      </div>
    );
  }

  return null;
}
