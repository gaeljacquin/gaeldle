'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@workspace/ui/lib/utils';
import { pixelateImage } from '@/lib/utils/pixelate';

interface ArtworkDisplayProps {
  imageUrl: string | null;
  pixelSize: number;
  isGameOver: boolean;
  className?: string;
}

export default function ArtworkDisplay({
  imageUrl,
  pixelSize,
  isGameOver,
  className,
}: ArtworkDisplayProps) {
  const [pixelatedData, setPixelatedData] = useState<{
    url: string;
    sourceUrl: string;
    pixelSize: number;
  } | null>(null);

  useEffect(() => {
    if (!imageUrl || isGameOver) {
      return;
    }

    const timer = setTimeout(() => {
      async function applyPixelation() {
        if (!imageUrl) {
          return;
        }

        try {
          const pixelated = await pixelateImage(imageUrl, pixelSize);

          setPixelatedData({ url: pixelated, sourceUrl: imageUrl, pixelSize });
        } catch (error) {
          console.error('Failed to pixelate artwork:', error);
          setPixelatedData({ url: imageUrl, sourceUrl: imageUrl, pixelSize });
        }
      }

      void applyPixelation();
    }, 0);

    return () => clearTimeout(timer);
  }, [imageUrl, pixelSize, isGameOver]);

  const shouldShowPixelated = !isGameOver;
  const isDataValid =
    pixelatedData?.sourceUrl === imageUrl &&
    pixelatedData?.pixelSize === pixelSize;

  const pixelatedImageUrl = isDataValid ? pixelatedData.url : null;
  const displayUrl = shouldShowPixelated ? pixelatedImageUrl : imageUrl;

  const shouldShowImage =
    !shouldShowPixelated || (shouldShowPixelated && !!pixelatedImageUrl);

  if (!imageUrl) {
    return (
      <div
        className={cn(
          'relative bg-muted flex items-center justify-center border aspect-video',
          className,
        )}
      >
        <span className="text-muted-foreground text-sm">
          No artwork available
        </span>
      </div>
    );
  }

  return (
    <div className={cn('relative border', className)}>
      <div className="aspect-video relative size-full overflow-hidden">
        {shouldShowImage && displayUrl ? (
          <Image
            src={displayUrl}
            alt="Game artwork"
            className="object-contain"
            fill
            unoptimized
            sizes="(max-width: 1024px) min(100vw, 480px), 50vw"
            priority
          />
        ) : null}
      </div>
    </div>
  );
}
