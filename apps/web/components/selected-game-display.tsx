'use client';

import { IconX } from '@tabler/icons-react';
import Image from 'next/image';
import type { Game, GameModeSlug } from '@workspace/api-contract';
import { cn } from '@workspace/ui/lib/utils';

interface SelectedGameDisplayProps {
  selectedGame: Game | null;
  onClearSelection?: () => void;
  className?: string;
  mode: GameModeSlug;
}

export default function SelectedGameDisplay({
  selectedGame,
  onClearSelection,
  className,
  mode = 'cover-art',
}: Readonly<SelectedGameDisplayProps>) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 border bg-card/90 p-3',
        className,
      )}
    >
      {selectedGame?.imageUrl && mode !== 'cover-art' ? (
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
        <p className="text-sm font-bold truncate text-foreground uppercase tracking-tight">
          {selectedGame?.name ?? '?'}
        </p>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          {selectedGame?.name ? 'Selected' : 'No selection'}
        </p>
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
