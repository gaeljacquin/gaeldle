'use client';

import Image from 'next/image';
import type { Game } from '@gaeldle/types/game';
import { cn } from '@/lib/utils';

interface GuessHistoryInlineProps {
  guesses: Game[];
  className?: string;
}

export default function GuessHistoryInline({ guesses, className }: GuessHistoryInlineProps) {
  if (guesses.length === 0) {
    return (
      <div className={cn('p-4 text-center text-sm text-muted-foreground italic', className)}>
        No guesses yet
      </div>
    );
  }

  // Reverse to show newest first
  const reversedGuesses = [...guesses].reverse();

  return (
    <div className={cn('overflow-y-auto', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {reversedGuesses.map((guess, index) => {
          const originalIndex = guesses.length - index;
          return (
            <div
              key={`${guess.id}-${index}`}
              className="flex items-center gap-2 p-2 bg-muted/50 rounded border border-border"
            >
              {guess.imageUrl ? (
                <Image
                  src={guess.imageUrl}
                  alt={guess.name}
                  className="w-12 h-16 object-cover rounded shrink-0"
                  width={48}
                  height={64}
                  sizes="100vw"
                />
              ) : (
                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center shrink-0">
                  <span className="text-xs text-muted-foreground">?</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{guess.name}</p>
                <p className="text-xs text-muted-foreground">Guess #{originalIndex}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
