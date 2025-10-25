'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { Game } from '@/lib/types/game';

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
          'relative rounded-lg overflow-hidden shadow-md',
          'w-[140px] h-[196px]',
          isDragging && 'opacity-50',
          className
        )}
        {...props}
      >
        {/* Cover Image */}
        <div className="absolute inset-0">
          {game.imageUrl ? (
            <img
              src={game.imageUrl}
              alt={game.name}
              className={cn(
                'w-full h-full object-cover',
                shouldGrayscale && 'grayscale'
              )}
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
        </div>

        {/* Upper Banner - Date/Question Mark */}
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

        {/* Lower Banner - Game Name */}
        <div className="absolute bottom-0 left-0 right-0 bg-blue-600 px-2 py-1 text-center">
          <p className="text-white text-xs font-medium truncate" title={game.name}>
            {game.name}
          </p>
        </div>
      </div>
    );
  }
);

TimelineCard.displayName = 'TimelineCard';
