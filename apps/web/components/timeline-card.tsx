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
    const shouldGrayscale = isGameOver && isCorrect === false;

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden border-2 border-border bg-card',
          'w-32 h-44',
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
              fill
              sizes="10vw"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] uppercase tracking-widest text-muted-foreground">
              No Data
            </div>
          )}
        </div>

        <div
          className={cn(
            'absolute top-0 left-0 right-0 px-2 py-1 text-center text-sm font-semibold text-white',
            isCorrect === true && 'bg-green-600',
            isCorrect === false && 'bg-destructive',
            isCorrect === undefined && 'bg-slate-600'
          )}
        >
          {showDate ? formatDate(game.firstReleaseDate) : '?'}
        </div>

        <div
          className={cn(
            'absolute inset-x-0 bottom-0 px-2 py-1 text-center border-t',
            isCorrect === true && 'bg-green-600/90 text-white',
            isCorrect === false && 'bg-destructive/90 text-white',
            isCorrect === undefined && 'bg-primary/90 text-primary-foreground'
          )}
        >
          <p className="truncate text-xs font-medium" title={game.name}>
            {game.name}
          </p>
        </div>
      </div>
    );
  }
);

TimelineCard.displayName = 'TimelineCard';
