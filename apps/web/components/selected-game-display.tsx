'use client';

import { IconX } from '@tabler/icons-react';
import Image from 'next/image';
import type { Game, GameModeSlug } from '@gaeldle/api-contract';
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
      <div className={cn('flex items-center gap-3 border bg-card/80 p-3', className)}>
        <div className="h-14 w-10 bg-muted animate-pulse" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-muted animate-pulse w-3/4" />
          <div className="h-3 bg-muted animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('group relative flex items-center gap-3 border bg-card/90 p-3', className)}>
      {selectedGame.imageUrl && mode !== 'cover-art' ? (
        <Image
          src={selectedGame.imageUrl}
          alt={selectedGame.name}
          className="h-14 w-10 object-cover border"
          width={48}
          height={64}
          sizes="10vw"
        />
      ) : (
        <div className="h-14 w-10 bg-muted flex items-center justify-center border">
          <span className="text-xs text-muted-foreground font-mono">?</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate text-foreground uppercase tracking-tight">{selectedGame.name}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Selected</p>
      </div>
      {onClearSelection ? (
        <button
          onClick={onClearSelection}
          className="absolute top-1 right-1 p-1 text-muted-foreground transition-all opacity-0 group-hover:opacity-100 hover:text-foreground cursor-pointer"
          aria-label="Clear selection"
        >
          <IconX className="size-3" />
        </button>
      ) : null}
    </div>
  );
}
