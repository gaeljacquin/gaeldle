'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { Game } from '@gaeldle/types/game';
import Image from 'next/image';

interface TimelineCardProps {
  game: Game;
  isCorrect?: boolean;
  showDate?: boolean;
  isDragging?: boolean;
  isGameOver?: boolean;
  className?: string;
}

// Convert Unix timestamp to yyyy-mm-dd format
function formatDate(timestamp: number | null): string {
  if (!timestamp) return '????-??-??';
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const TimelineCard = forwardRef<HTMLDivElement, TimelineCardProps>(
  ({ game, isCorrect, showDate = false, isDragging = false, isGameOver = false, className, ...props }, ref) => {
    // Apply grayscale to incorrect cards when game is over
    const shouldGrayscale = isGameOver && isCorrect === false;

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm',
          'w-35 h-49',
          isDragging && 'opacity-50',
          className
        )}
        {...props}
      >
        <div className="absolute inset-0">
          {game.imageUrl ? (
            <Image
              src={game.imageUrl}
              alt={game.name}
              className={cn(
                'w-full h-full object-cover',
                shouldGrayscale && 'grayscale'
              )}
              width={16}
              height={16}
              sizes='100vw'
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
        </div>

        <div
          className={cn(
            'absolute top-0 left-0 right-0 px-2 py-1 text-center text-white text-sm font-semibold',
            isCorrect === true && 'bg-green-600',
            isCorrect === false && 'bg-red-600',
            isCorrect === undefined && 'bg-slate-600'
          )}
        >
          {showDate ? formatDate(game.firstReleaseDate) : '?'}
        </div>

        <div
          className={cn(
            'absolute inset-x-0 bottom-0 px-2 py-1 text-center',
            isCorrect === true && 'bg-green-600/90',
            isCorrect === false && 'bg-destructive/90',
            isCorrect === undefined && 'bg-primary/90'
          )}
        >
          <p className="truncate text-xs font-medium text-primary-foreground" title={game.name}>
            {game.name}
          </p>
        </div>
      </div>
    );
  }
);

TimelineCard.displayName = 'TimelineCard';
