'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import type { Game, GameModeSlug } from '@gaeldle/types/game';
import { cn } from '@/lib/utils';

interface SelectedGameDisplayProps {
  selectedGame: Game | null;
  onClearSelection?: () => void;
  showSkeleton?: boolean;
  className?: string;
  mode: GameModeSlug;
}

export default function SelectedGameDisplay({
  selectedGame,
  onClearSelection,
  showSkeleton = false,
  className,
  mode = 'cover-art',
}: Readonly<SelectedGameDisplayProps>) {
  if (showSkeleton || !selectedGame) {
    return (
      <div className={cn('flex items-center gap-3 rounded-xl border border-border bg-card/80 p-3 shadow-sm', className)}>
        <div className="h-14 w-10 rounded bg-muted animate-pulse" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('group relative flex items-center gap-3 rounded-xl border border-border bg-card/90 p-3 shadow-sm', className)}>
      {selectedGame.imageUrl && mode !== 'cover-art' ? (
        <Image
          src={selectedGame.imageUrl}
          alt={selectedGame.name}
          className="h-14 w-10 rounded object-cover"
          width={48}
          height={64}
          sizes="100vw"
        />
      ) : (
        <div className="h-14 w-10 rounded bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">?</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{selectedGame.name}</p>
        <p className="text-xs text-muted-foreground">Selected</p>
      </div>
      {onClearSelection && (
        <button
          onClick={onClearSelection}
          className="absolute top-2 right-2 rounded-full bg-muted p-1 text-muted-foreground transition-all opacity-0 group-hover:opacity-100 hover:text-foreground"
          aria-label="Clear selection"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}
