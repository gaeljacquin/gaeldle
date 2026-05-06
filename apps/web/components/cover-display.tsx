'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { pixelateImage } from '@/lib/utils/pixelate';
import { cn } from '@workspace/ui/lib/utils';
import type { Game } from '@workspace/api-contract';
import Stuck from '@/components/stuck';

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
}: Readonly<CoverDisplayProps>) {
  const [pixelatedData, setPixelatedData] = useState<{
    url: string;
    sourceUrl: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Early return for invalid states
    if (!sourceImageUrl || !usePixelation || isGameOver || isLoading) {
      setIsProcessing(false);
      return;
    }

    const timer = setTimeout(() => {
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
          setPixelatedData({ url: sourceImageUrl, sourceUrl: sourceImageUrl });
        } finally {
          setIsProcessing(false);
        }
      }

      void applyPixelation();
    }, 0);

    return () => clearTimeout(timer);
  }, [sourceImageUrl, pixelSize, usePixelation, isGameOver, isLoading]);

  if (!game) {
    return <Stuck stuckState="none" className={className} />;
  }

  // Determine what to display
  const shouldShowPixelated = usePixelation && !isGameOver;
  // Only use pixelated URL if it matches the current source
  const pixelatedUrl =
    pixelatedData && pixelatedData.sourceUrl === sourceImageUrl
      ? pixelatedData.url
      : null;
  const displayUrl = shouldShowPixelated ? pixelatedUrl : sourceImageUrl;

  // Don't show original image if we're waiting for pixelation
  const shouldShowImage =
    !shouldShowPixelated || (shouldShowPixelated && pixelatedUrl);

  if (!sourceImageUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted border',
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">No cover available</p>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-muted border', className)}>
      {isProcessing || !shouldShowImage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : null}
      {shouldShowImage && displayUrl ? (
        <Image
          src={displayUrl}
          alt={isGameOver ? game.name : 'Game cover'}
          className="object-contain"
          fill
          sizes="(max-width: 1024px) min(100vw, 480px), 50vw"
          priority
        />
      ) : null}
      {isGameOver ? (
        <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-2 text-center border-t">
          <p className="font-semibold">{game.name}</p>
        </div>
      ) : null}
    </div>
  );
}
