'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { pixelateImage } from '@/lib/utils/pixelate';
import { cn } from '@/lib/utils';
import type { Game } from '@/lib/types/game';

interface CoverDisplayProps {
  game: Game | null;
  pixelSize?: number;
  usePixelation?: boolean;
  isGameOver?: boolean;
  className?: string;
}

export function CoverDisplay({
  game,
  pixelSize = 0,
  usePixelation = false,
  isGameOver = false,
  className,
}: CoverDisplayProps) {
  const [pixelatedUrl, setPixelatedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!game?.imageUrl || !usePixelation || isGameOver) {
      setPixelatedUrl(null);
      return;
    }

    async function applyPixelation() {
      if (!game || !game.imageUrl) return;

      try {
        setIsProcessing(true);
        const pixelated = await pixelateImage(game.imageUrl, pixelSize);
        setPixelatedUrl(pixelated);
      } catch (error) {
        console.error('Failed to pixelate image:', error);
        setPixelatedUrl(null);
      } finally {
        setIsProcessing(false);
      }
    }

    applyPixelation();
  }, [game?.imageUrl, pixelSize, usePixelation, isGameOver, game]);

  if (!game) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted rounded-lg',
          className
        )}
      >
        <p className="text-muted-foreground">Loading game...</p>
      </div>
    );
  }

  const displayUrl = usePixelation && !isGameOver && pixelatedUrl
    ? pixelatedUrl
    : game.imageUrl;

  if (!displayUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted rounded-lg',
          className
        )}
      >
        <p className="text-muted-foreground">No cover available</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted',
        className
      )}
    >
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <p className="text-sm text-muted-foreground">Processing...</p>
        </div>
      )}
      <Image
        src={displayUrl}
        alt={isGameOver ? game.name : 'Game cover'}
        fill
        className="object-contain"
        priority
      />
      {isGameOver && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2 text-center">
          <p className="font-semibold">{game.name}</p>
        </div>
      )}
    </div>
  );
}
