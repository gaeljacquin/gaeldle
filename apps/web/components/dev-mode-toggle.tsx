'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Minus } from 'lucide-react';
import type { Game } from '@gaeldle/types/game';

interface DevModeToggleProps {
  targetGame: Game | null;
  attemptsLeft: number;
  maxAttempts: number;
  onAdjustAttempts?: (delta: number) => void;
  className?: string;
}

export default function DevModeToggle({
  targetGame,
  attemptsLeft,
  maxAttempts,
  onAdjustAttempts,
  className
}: Readonly<DevModeToggleProps>) {
  const [showDevInfo, setShowDevInfo] = useState(false);

  if (!targetGame || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={cn('pt-3 space-y-2', className)}>
      <p className="text-xs font-semibold">[dev]</p>
      <button
        onClick={() => setShowDevInfo(!showDevInfo)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        {showDevInfo ? 'Hide' : 'Show'} Answer
      </button>
      {showDevInfo && (
        <p className="text-xs font-mono p-2 bg-muted rounded">
          {targetGame.name}
        </p>
      )}

      {onAdjustAttempts && (
        <div className="flex items-center justify-center gap-2">
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
