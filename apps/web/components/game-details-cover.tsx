'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { getGameByIgdbId } from '@/lib/services/game.service';
import Image from 'next/image';
import { IconExternalLink, IconEyeOff } from '@tabler/icons-react';

export default function GameDetailsCover({ igdbId }: { igdbId: string }) {
  const { data: game } = useSuspenseQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  if (!game.imageUrl) {
    return (
      <div className="size-full bg-muted flex items-center justify-center text-muted-foreground text-xs relative">
        {game.hidden && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/80 text-amber-400 px-2.5 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-amber-500/30">
            <IconEyeOff size={14} aria-hidden="true" />
            <span>Hidden</span>
          </div>
        )}
        No Cover Art
      </div>
    );
  }

  return (
    <>
      {game.hidden && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/80 text-amber-400 px-2.5 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-amber-500/30">
          <IconEyeOff size={14} aria-hidden="true" />
          <span>Hidden</span>
        </div>
      )}
      <Image
        src={game.imageUrl.replace('t720p', 't1080p').replace('.jpg', '.png')}
        alt={game.name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        priority
        sizes="(max-width: 1024px) 100vw, 320px"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
        <IconExternalLink
          aria-hidden="true"
          className="text-white opacity-0 group-hover:opacity-100 transition-opacity size-8"
        />
      </div>
    </>
  );
}
