'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Minus, X } from 'lucide-react';
import type { SpecificationGuess, Game } from '@/lib/types/game';
import Image from 'next/image';

interface GuessHistorySidebarProps {
  guesses: SpecificationGuess[];
  isVisible: boolean;
  selectedGame: Game | null;
  targetGame: Game | null;
  attemptsLeft: number;
  maxAttempts: number;
  onAdjustAttempts?: (delta: number) => void;
  onClearSelection?: () => void;
  className?: string;
}

export function GuessHistorySidebar({
  guesses,
  isVisible,
  selectedGame,
  targetGame,
  attemptsLeft,
  maxAttempts,
  onAdjustAttempts,
  onClearSelection,
  className
}: GuessHistorySidebarProps) {
  const [showDevInfo, setShowDevInfo] = useState(false);
  const [isHoveringSelected, setIsHoveringSelected] = useState(false);

  if (!isVisible) return null;

  // Reverse guesses to show newest first
  const reversedGuesses = [...guesses].reverse();

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-semibold text-muted-foreground">Guess History</h3>
      <div className="space-y-2">
        {/* Selected game - shown at top with dark styling */}
        {selectedGame && (
          <div
            className="relative flex items-center gap-2 p-2 bg-slate-700 rounded border border-slate-600 group"
            onMouseEnter={() => setIsHoveringSelected(true)}
            onMouseLeave={() => setIsHoveringSelected(false)}
          >
            {selectedGame.imageUrl ? (
              <Image
                src={selectedGame.imageUrl}
                alt={selectedGame.name}
                className="w-12 h-16 object-cover rounded"
                width={48}
                height={64}
                sizes="100vw"
              />
            ) : (
              <div className="w-12 h-16 bg-slate-600 rounded flex items-center justify-center">
                <span className="text-xs text-slate-300">?</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-white">{selectedGame.name}</p>
              <p className="text-xs text-slate-300">Selected</p>
            </div>
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className={cn(
                  'absolute top-2 right-2 p-1 bg-slate-600 hover:bg-slate-500 rounded-full transition-all cursor-pointer',
                  isHoveringSelected ? 'opacity-100' : 'opacity-0'
                )}
                aria-label="Clear selection"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        )}

        {/* Previous guesses */}
        {reversedGuesses.length === 0 && !selectedGame ? (
          <p className="text-xs text-muted-foreground italic">No guesses yet</p>
        ) : (
          reversedGuesses.map((guess, index) => {
            const originalIndex = guesses.length - index;
            return (
              <div
                key={`${guess.gameId}-${index}`}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded border border-border"
              >
                {guess.imageUrl ? (
                  <Image
                    src={guess.imageUrl}
                    alt={guess.gameName}
                    className="w-12 h-16 object-cover rounded"
                    width={48}
                    height={64}
                    sizes="100vw"
                  />
                ) : (
                  <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">?</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{guess.gameName}</p>
                  <p className="text-xs text-muted-foreground">Guess #{originalIndex}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dev mode toggle */}
      {targetGame && (
        <div className="pt-3 border-t border-border space-y-2">
          <button
            onClick={() => setShowDevInfo(!showDevInfo)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            [dev] {showDevInfo ? 'Hide' : 'Show'} Answer
          </button>
          {showDevInfo && (
            <p className="text-xs font-mono p-2 bg-muted rounded">
              {targetGame.name}
            </p>
          )}

          {/* Attempts controls */}
          {onAdjustAttempts && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">[dev] Attempts:</span>
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
      )}
    </div>
  );
}
