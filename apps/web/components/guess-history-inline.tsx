'use client';

import Image from 'next/image';
import type { Game } from '@workspace/api/db';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/badge';
import { extractArray } from '@workspace/shared';

interface GuessHistoryInlineProps {
  guesses: (Game | null)[];
  targetGame?: Game | null;
  className?: string;
}

function hasMatchingItem(a: unknown, b: unknown): boolean {
  const listA = extractArray(a)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const listB = extractArray(b)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (listA.length === 0 || listB.length === 0) {
    return false;
  }

  return listA.some((item) => listB.includes(item));
}

export default function GuessHistoryInline({
  guesses,
  targetGame,
  className,
}: GuessHistoryInlineProps) {
  if (guesses.length === 0) {
    return null;
  }

  const reversedGuesses = [...guesses].reverse();

  return (
    <div className={cn('overflow-y-auto', className)}>
      <div className="flex flex-col gap-2">
        {reversedGuesses.map((guess, index) => {
          const originalIndex = guesses.length - index;

          if (guess === null) {
            return (
              <div
                key={`skip-${originalIndex}`}
                className="flex items-center gap-3 border border-border bg-card/70 p-2"
              >
                <div className="h-16 w-12 bg-muted flex items-center justify-center shrink-0 border">
                  <span className="text-xs text-muted-foreground font-mono">
                    -
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate uppercase tracking-tight">
                    Skipped
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">
                    Guess #{originalIndex}
                  </p>
                </div>
              </div>
            );
          }

          const isSameFranchise = Boolean(
            targetGame &&
            hasMatchingItem(guess.franchises, targetGame.franchises),
          );
          const isSameSeries = Boolean(
            targetGame &&
            hasMatchingItem(guess.collections, targetGame.collections),
          );

          return (
            <div
              key={`${guess.id}-${index}`}
              className="flex items-center gap-3 border border-border bg-card/70 p-2"
            >
              {guess.imageUrl ? (
                <Image
                  src={guess.imageUrl}
                  alt={guess.name}
                  className="h-16 w-12 object-cover shrink-0 border"
                  width={48}
                  height={64}
                  sizes="10vw"
                />
              ) : (
                <div className="h-16 w-12 bg-muted flex items-center justify-center shrink-0 border">
                  <span className="text-xs text-muted-foreground font-mono">
                    ?
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate uppercase tracking-tight">
                  {guess.name}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  Guess #{originalIndex}
                </p>
              </div>
              {(isSameFranchise || isSameSeries) && (
                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                  {isSameFranchise && (
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
                      Franchise
                    </Badge>
                  )}
                  {isSameSeries && (
                    <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800">
                      Series
                    </Badge>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
