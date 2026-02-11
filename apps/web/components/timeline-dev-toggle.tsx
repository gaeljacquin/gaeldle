'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import type { Game } from '@gaeldle/types/game';

interface TimelineDevToggleProps {
  getCorrectOrder: () => Game[];
  attemptsLeft: number;
  maxAttempts: number;
  onAdjustAttempts?: (delta: number) => void;
  className?: string;
}

function formatReleaseDate(timestamp: number | null): string {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TimelineDevToggle({
  getCorrectOrder,
  attemptsLeft,
  maxAttempts,
  onAdjustAttempts,
  className
}: Readonly<TimelineDevToggleProps>) {
  const [showDevInfo, setShowDevInfo] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const correctOrder = getCorrectOrder();

  return (
    <div className={cn('pt-2 space-y-2', className)}>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">[dev]</p>
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
                {formatReleaseDate(game.firstReleaseDate)}
              </span>
            </div>
          ))}
        </div>
      )}

      {onAdjustAttempts && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Attempts:</span>
          <button
            onClick={() => onAdjustAttempts(-1)}
            disabled={attemptsLeft <= 1}
            className={cn(
              'p-0.5 border hover:bg-muted transition-colors cursor-pointer',
              attemptsLeft <= 1 && 'opacity-50 cursor-not-allowed'
            )}
            title="Decrease attempts"
          >
            <IconMinus className="h-3 w-3" />
          </button>
          <span className="text-xs font-mono">{attemptsLeft}/{maxAttempts}</span>
          <button
            onClick={() => onAdjustAttempts(1)}
            disabled={attemptsLeft >= maxAttempts}
            className={cn(
              'p-0.5 border hover:bg-muted transition-colors cursor-pointer',
              attemptsLeft >= maxAttempts && 'opacity-50 cursor-not-allowed'
            )}
            title="Increase attempts"
          >
            <IconPlus className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
