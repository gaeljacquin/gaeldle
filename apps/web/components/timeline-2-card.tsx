'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { Game } from '@gaeldle/api-contract';
import Image from 'next/image';

interface Timeline2CardProps {
  game: Game;
  showDate?: boolean;
  className?: string;
  bannerColor?: 'green' | 'red' | 'slate' | 'none';
}

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
          'relative overflow-hidden border-2 border-border bg-card shadow-sm select-none',
          'w-32 h-44',
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
              fill
              sizes="10vw"
              loading="eager"
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
            bannerColor === 'green' && 'bg-green-600',
            bannerColor === 'red' && 'bg-destructive',
            bannerColor === 'slate' && 'bg-slate-600'
          )}
        >
          {showDate ? formatDate(game.firstReleaseDate) : '?'}
        </div>

        <div
          className={cn(
            'absolute inset-x-0 bottom-0 px-2 py-1 text-center border-t',
            bannerColor === 'green' && 'bg-green-600/90 text-white',
            bannerColor === 'red' && 'bg-destructive/90 text-white',
            bannerColor === 'slate' && 'bg-slate-600/90 text-white',
            bannerColor === 'none' && 'bg-primary/90 text-primary-foreground'
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

Timeline2Card.displayName = 'Timeline2Card';
