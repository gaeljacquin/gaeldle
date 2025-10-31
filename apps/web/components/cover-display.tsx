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
  isLoading?: boolean;
  className?: string;
  sourceImageUrl?: string | null;
}

export default function CoverDisplay({
  game,
  pixelSize = 0,
  usePixelation = false,
  isGameOver = false,
  isLoading = false,
  className,
  sourceImageUrl,
}: CoverDisplayProps) {
  const [pixelatedData, setPixelatedData] = useState<{url: string; sourceUrl: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Early return for invalid states - don't clear cached data yet
    if (!sourceImageUrl || !usePixelation || isGameOver || isLoading) {
      setIsProcessing(false);
      return;
    }

    // Clear old pixelated image only when we're about to generate a new one
    setPixelatedData(null);

    async function applyPixelation() {
      if (!sourceImageUrl) return;

      try {
        setIsProcessing(true);
        const pixelated = await pixelateImage(sourceImageUrl, pixelSize);
        // Store both the pixelated URL and the source it came from
        setPixelatedData({ url: pixelated, sourceUrl: sourceImageUrl });
      } catch (error) {
        console.error('Failed to pixelate image:', error);
        setPixelatedData(null);
      } finally {
        setIsProcessing(false);
      }
    }

    applyPixelation();
  }, [sourceImageUrl, pixelSize, usePixelation, isGameOver, isLoading]);

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

  // Determine what to display
  const shouldShowPixelated = usePixelation && !isGameOver;
  // Only use pixelated URL if it matches the current source
  const pixelatedUrl = (pixelatedData && pixelatedData.sourceUrl === sourceImageUrl) ? pixelatedData.url : null;
  const displayUrl = shouldShowPixelated ? pixelatedUrl : sourceImageUrl;

  // Don't show original image if we're waiting for pixelation
  const shouldShowImage = !shouldShowPixelated || (shouldShowPixelated && pixelatedUrl);

  if (!sourceImageUrl) {
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
      {(isProcessing || !shouldShowImage) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      )}
      {shouldShowImage && displayUrl && (
        <Image
          src={displayUrl}
          alt={isGameOver ? game.name : 'Game cover'}
          className="object-contain"
          fill
          sizes="10vw"
          priority
        />
      )}
      {isGameOver && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2 text-center">
          <p className="font-semibold">{game.name}</p>
        </div>
      )}
    </div>
  );
}
