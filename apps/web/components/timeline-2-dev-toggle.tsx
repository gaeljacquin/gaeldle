'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Minus } from 'lucide-react';
import type { Game } from '@/lib/types/game';

interface Timeline2DevToggleProps {
  dealtCard: Game | null;
  attemptsLeft: number;
  maxAttempts: number;
  onAdjustAttempts?: (delta: number) => void;
  className?: string;
}

function formatReleaseDate(timestamp: number | null): string {
  if (!timestamp) return 'Unknown';

  // IGDB timestamps are in seconds, convert to milliseconds
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Timeline2DevToggle({
  dealtCard,
  attemptsLeft,
  maxAttempts,
  onAdjustAttempts,
  className
}: Timeline2DevToggleProps) {
  const [showDevInfo, setShowDevInfo] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={cn('pt-3 space-y-2', className)}>
      <p className="text-xs font-semibold">[dev]</p>
      <button
        onClick={() => setShowDevInfo(!showDevInfo)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        {showDevInfo ? 'Hide' : 'Show'} Current Card
      </button>
      {showDevInfo && dealtCard && (
        <div className="text-xs font-mono p-3 bg-muted rounded space-y-1">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{dealtCard.name}</span>
            <span className="text-muted-foreground">
              {formatReleaseDate(dealtCard.firstReleaseDate)}
            </span>
          </div>
        </div>
      )}

      {onAdjustAttempts && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Attempts:</span>
          <button
            onClick={() => onAdjustAttempts(-1)}
            disabled={attemptsLeft <= 1}
            className={cn(
              'p-1 rounded hover:bg-muted transition-colors cursor-pointer',
              attemptsLeft <= 1 && 'opacity-50 cursor-not-allowed'
            )}
            title="Decrease attempts"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-xs font-mono">{attemptsLeft}/{maxAttempts}</span>
          <button
            onClick={() => onAdjustAttempts(1)}
            disabled={attemptsLeft >= maxAttempts}
            className={cn(
              'p-1 rounded hover:bg-muted transition-colors cursor-pointer',
              attemptsLeft >= maxAttempts && 'opacity-50 cursor-not-allowed'
            )}
            title="Increase attempts"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
