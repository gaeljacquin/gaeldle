'use client';

import Image from 'next/image';
import type { Game } from '@gaeldle/types/game';
import { cn } from '@/lib/utils';

interface GuessHistoryInlineProps {
  guesses: Game[];
  className?: string;
}

export default function GuessHistoryInline({ guesses, className }: Readonly<GuessHistoryInlineProps>) {
  if (guesses.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border bg-card/60 p-4 text-center text-sm text-muted-foreground', className)}>
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
              className="flex items-center gap-3 rounded-xl border border-border bg-card/70 p-2.5"
            >
              {guess.imageUrl ? (
                <Image
                  src={guess.imageUrl}
                  alt={guess.name}
                  className="h-16 w-12 rounded object-cover shrink-0"
                  width={48}
                  height={64}
                  sizes="100vw"
                />
              ) : (
                <div className="h-16 w-12 rounded bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs text-muted-foreground">?</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{guess.name}</p>
                <p className="text-xs text-muted-foreground">Guess #{originalIndex}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
