'use client';

import { useState } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import type { Game } from '@workspace/api-contract';
import { timelineFormatDate } from '@workspace/shared';

interface TimelineDevToggleProps {
  getCorrectOrder: () => Game[];
  attemptsLeft: number;
  maxAttempts: number;
  onAdjustAttempts?: (delta: number) => void;
  className?: string;
}

export default function TimelineDevToggle({
  getCorrectOrder,
  attemptsLeft,
  maxAttempts,
  onAdjustAttempts,
  className,
}: TimelineDevToggleProps) {
  const [showDevInfo, setShowDevInfo] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const correctOrder = getCorrectOrder();

  return (
    <div className={cn('pt-2 space-y-2', className)}>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        [dev]
      </p>
      <button
        onClick={() => setShowDevInfo(!showDevInfo)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer uppercase tracking-widest"
      >
        {showDevInfo ? 'Hide' : 'Show'} Correct Order
      </button>

      {showDevInfo && (
        <div className="text-xs font-mono p-3 bg-muted border border-border/50 space-y-1 max-w-md text-left uppercase">
          {correctOrder.map((game, index) => (
            <div key={game.id} className="flex gap-2">
              <span className="font-bold">{index + 1}.</span>
              <span className="flex-1 truncate">{game.name}</span>
              <span className="text-muted-foreground whitespace-nowrap">
                {timelineFormatDate(game.firstReleaseDate)}
              </span>
            </div>
          ))}
        </div>
      )}

      {onAdjustAttempts && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">
            Attempts:
          </span>
          <button
            onClick={() => onAdjustAttempts(-1)}
            disabled={attemptsLeft <= 1}
            className={cn(
              'p-0.5 border hover:bg-muted transition-colors cursor-pointer',
              attemptsLeft <= 1 && 'opacity-50 cursor-not-allowed',
            )}
            title="Decrease attempts"
          >
            <IconMinus className="size-3" />
          </button>
          <span className="text-xs font-mono">
            {attemptsLeft}/{maxAttempts}
          </span>
          <button
            onClick={() => onAdjustAttempts(1)}
            disabled={attemptsLeft >= maxAttempts}
            className={cn(
              'p-0.5 border hover:bg-muted transition-colors cursor-pointer',
              attemptsLeft >= maxAttempts && 'opacity-50 cursor-not-allowed',
            )}
            title="Increase attempts"
          >
            <IconPlus className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}
