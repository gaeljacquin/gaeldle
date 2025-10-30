'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import type { Game } from '@/lib/types/game';
import { cn } from '@/lib/utils';

interface SelectedGameDisplayProps {
  selectedGame: Game | null;
  onClearSelection?: () => void;
  showSkeleton?: boolean;
  className?: string;
}

export default function SelectedGameDisplay({
  selectedGame,
  onClearSelection,
  showSkeleton = false,
  className
}: SelectedGameDisplayProps) {
  if (showSkeleton || !selectedGame) {
    return (
      <div className={cn('flex items-center gap-2 p-2 bg-slate-600/50 rounded border border-border', className)}>
        <div className="w-12 h-16 bg-slate-100 rounded animate-pulse" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative flex items-center gap-2 p-2 bg-slate-700 rounded border border-slate-600 group', className)}>
      {selectedGame.imageUrl ? (
        <Image
          src={selectedGame.imageUrl}
          alt={selectedGame.name}
          className="w-12 h-16 object-cover rounded"
          width={48}
          height={64}
          sizes="100vw"
        />
      ) : (
        <div className="w-12 h-16 bg-slate-600 rounded flex items-center justify-center">
          <span className="text-xs text-slate-300">?</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate text-white">{selectedGame.name}</p>
        <p className="text-xs text-slate-300">Selected</p>
      </div>
      {onClearSelection && (
        <button
          onClick={onClearSelection}
          className="absolute top-2 right-2 p-1 bg-slate-600 hover:bg-slate-500 rounded-full transition-all cursor-pointer opacity-0 group-hover:opacity-100"
          aria-label="Clear selection"
        >
          <X className="size-3 text-white" />
        </button>
      )}
    </div>
  );
}
