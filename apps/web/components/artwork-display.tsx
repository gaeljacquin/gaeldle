'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@workspace/ui/lib/utils';
import { pixelateImage } from '@/lib/utils/pixelate';

interface ArtworkDisplayProps {
  imageUrl: string | null;
  pixelSize: number;
  isGameOver: boolean;
  isLoading?: boolean;
  className?: string;
}

export default function ArtworkDisplay({
  imageUrl,
  pixelSize,
  isGameOver,
  isLoading = false,
  className,
}: Readonly<ArtworkDisplayProps>) {
  const [pixelatedData, setPixelatedData] = useState<{
    url: string;
    sourceUrl: string;
    pixelSize: number;
  } | null>(null);

  // Apply pixelation when image URL or pixel size changes
  useEffect(() => {
    // Early return for invalid states
    if (!imageUrl || isGameOver || isLoading) {
      return;
    }

    const timer = setTimeout(() => {
      async function applyPixelation() {
        if (!imageUrl) return;

        try {
          const pixelated = await pixelateImage(imageUrl, pixelSize);
          // Store both the pixelated URL and the source/params it came from
          setPixelatedData({ url: pixelated, sourceUrl: imageUrl, pixelSize });
        } catch (error) {
          console.error('Failed to pixelate artwork:', error);
          setPixelatedData({ url: imageUrl, sourceUrl: imageUrl, pixelSize });
        }
      }

      void applyPixelation();
    }, 0);

    return () => clearTimeout(timer);
  }, [imageUrl, pixelSize, isGameOver, isLoading]);

  // Determine what to display
  const shouldShowPixelated = !isGameOver;
  // Only use pixelated URL if it matches the current source and parameters
  const isDataValid =
    pixelatedData?.sourceUrl === imageUrl &&
    pixelatedData?.pixelSize === pixelSize;
  const pixelatedImageUrl = isDataValid ? pixelatedData.url : null;
  const displayUrl = shouldShowPixelated ? pixelatedImageUrl : imageUrl;

  // Don't show original image if we're waiting for pixelation
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
      {isLoading || !shouldShowImage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : null}

      <div className="aspect-video relative w-full h-full overflow-hidden">
        {shouldShowImage && displayUrl ? (
          <Image
            src={displayUrl}
            alt="Game artwork"
            className="object-contain"
            fill
            sizes="(max-width: 1024px) min(100vw, 480px), 50vw"
            priority
          />
        ) : null}
      </div>
    </div>
  );
}
