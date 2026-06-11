'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { pixelateImage } from '@/lib/utils/pixelate';
import { cn } from '@workspace/ui/lib/utils';
import type { Game } from '@workspace/api-contract';
import ImageDisplaySkeleton from '@/components/image-display-skeleton';

interface CoverDisplayProps {
  game: Game | null;
  pixelSize?: number;
  usePixelation?: boolean;
  isGameOver?: boolean;
  className?: string;
  sourceImageUrl?: string | null;
  objectFit?: 'contain' | 'cover';
}

export default function CoverDisplay({
  game,
  pixelSize = 0,
  usePixelation = false,
  isGameOver = false,
  className,
  sourceImageUrl,
  objectFit = 'contain',
}: CoverDisplayProps) {
  const [pixelatedData, setPixelatedData] = useState<{
    url: string;
    sourceUrl: string;
    pixelSize: number;
  } | null>(null);

  useEffect(() => {
    // Early return for invalid states
    if (!sourceImageUrl || !usePixelation || isGameOver) {
      return;
    }

    const timer = setTimeout(() => {
      async function applyPixelation() {
        if (!sourceImageUrl) return;

        try {
          const pixelated = await pixelateImage(sourceImageUrl, pixelSize);
          // Store both the pixelated URL and the source/params it came from
          setPixelatedData({
            url: pixelated,
            sourceUrl: sourceImageUrl,
            pixelSize,
          });
        } catch (error) {
          console.error('Failed to pixelate image:', error);
          setPixelatedData({
            url: sourceImageUrl,
            sourceUrl: sourceImageUrl,
            pixelSize,
          });
        }
      }

      void applyPixelation();
    }, 0);

    return () => clearTimeout(timer);
  }, [sourceImageUrl, pixelSize, usePixelation, isGameOver]);

  // Determine what to display
  const shouldShowPixelated = usePixelation && !isGameOver;
  // Only use pixelated URL if it matches the current source and parameters
  const isDataValid =
    pixelatedData?.sourceUrl === sourceImageUrl &&
    pixelatedData?.pixelSize === pixelSize;
  const pixelatedUrl = isDataValid ? pixelatedData.url : null;
  const displayUrl = shouldShowPixelated ? pixelatedUrl : sourceImageUrl;

  // Don't show original image if we're waiting for pixelation
  const shouldShowImage =
    !shouldShowPixelated || (shouldShowPixelated && !!pixelatedUrl);

  if (!sourceImageUrl) {
    return <ImageDisplaySkeleton />;
  }

  return (
    <div className={cn('relative overflow-hidden bg-muted border', className)}>
      {shouldShowImage && displayUrl ? (
        <Image
          src={displayUrl}
          alt={game && isGameOver ? game?.name : 'Game cover'}
          className={cn(
            objectFit === 'cover' ? 'object-cover' : 'object-contain',
          )}
          fill
          unoptimized
          sizes="(max-width: 1024px) min(100vw, 480px), 50vw"
          priority
        />
      ) : null}
      {isGameOver ? (
        <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-2 text-center border-t">
          <p className="font-semibold">{game?.name}</p>
        </div>
      ) : null}
    </div>
  );
}
