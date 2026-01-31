'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
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
  const [pixelatedData, setPixelatedData] = useState<{url: string; sourceUrl: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Apply pixelation when image URL or pixel size changes
  useEffect(() => {
    // Early return for invalid states - don't clear cached data yet
    if (!imageUrl || isGameOver || isLoading) {
      setIsProcessing(false);
      return;
    }

    // Clear old pixelated image only when we're about to generate a new one
    setPixelatedData(null);

    async function applyPixelation() {
      if (!imageUrl) return;

      try {
        setIsProcessing(true);
        const pixelated = await pixelateImage(imageUrl, pixelSize);
        // Store both the pixelated URL and the source it came from
        setPixelatedData({ url: pixelated, sourceUrl: imageUrl });
      } catch (error) {
        console.error('Failed to pixelate artwork:', error);
        setPixelatedData(null);
      } finally {
        setIsProcessing(false);
      }
    }

    applyPixelation();
  }, [imageUrl, pixelSize, isGameOver, isLoading]);

  // Determine what to display
  const shouldShowPixelated = !isGameOver;
  // Only use pixelated URL if it matches the current source
  const pixelatedImageUrl = (pixelatedData?.sourceUrl === imageUrl) ? pixelatedData.url : null;
  const displayUrl = shouldShowPixelated ? pixelatedImageUrl : imageUrl;

  // Don't show original image if we're waiting for pixelation
  const shouldShowImage = !shouldShowPixelated || (shouldShowPixelated && pixelatedImageUrl);

  if (!imageUrl) {
    return (
      <div className={cn('relative bg-muted rounded-lg flex items-center justify-center', className)}>
        <span className="text-muted-foreground">No artwork available</span>
      </div>
    );
  }

  return (
    <>
      <div className={cn('relative', className)}>
        {(isProcessing || !shouldShowImage) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10 rounded-lg">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}
        <AspectRatio ratio={16 / 9}>
          <div className="relative w-full h-full">
            {shouldShowImage && displayUrl && (
              <Image
                src={displayUrl}
                alt="Game artwork"
                className="object-contain rounded-lg"
                fill
                sizes="10vw"
                priority
              />
            )}
          </div>
        </AspectRatio>

        {/* <Button
          onClick={() => setIsExpanded(true)}
          className="absolute top-2 right-2 cursor-pointer"
          size="icon"
          variant="secondary"
        >
          <Expand className="size-4" />
        </Button> */}
      </div>

      {/* <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogTitle className="text-sm hidden">
          Artwork
        </DialogTitle>
        <DialogContent className="max-w-4xl">
          <div className="relative w-full aspect-video">
            <Image
              src={displayUrl || imageUrl}
              alt="Game artwork (expanded)"
              className="object-contain"
              fill
              sizes="10vw"
            />
          </div>
        </DialogContent>
      </Dialog> */}
    </>
  );
}
