'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { Game } from '@gaeldle/types/game';
import Image from 'next/image';

interface Timeline2CardProps {
  game: Game;
  showDate?: boolean;
  className?: string;
  bannerColor?: 'green' | 'red' | 'slate' | 'none';
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

export const Timeline2Card = forwardRef<HTMLDivElement, Timeline2CardProps>(
  ({ game, showDate = false, bannerColor = 'none', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-lg overflow-hidden shadow-md select-none',
          'w-[140px] h-[196px]',
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 pointer-events-none">
          {game.imageUrl ? (
            <Image
              src={game.imageUrl}
              alt={game.name}
              className="w-full h-full object-cover"
              draggable={false}
              width={16}
              height={24}
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
            bannerColor === 'green' && 'bg-green-600',
            bannerColor === 'red' && 'bg-red-600',
            bannerColor === 'slate' && 'bg-slate-600'
          )}
        >
          {showDate ? formatDate(game.firstReleaseDate) : '?'}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-blue-600 px-2 py-1 text-center">
          <p className="text-white text-xs font-medium truncate" title={game.name}>
            {game.name}
          </p>
        </div>
      </div>
    );
  }
);

Timeline2Card.displayName = 'Timeline2Card';
