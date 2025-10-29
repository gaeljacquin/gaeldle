'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
// import { Button } from '@/components/ui/button';
// import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
// import { Expand } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  // const [isExpanded, setIsExpanded] = useState(false);
  const [pixelatedImageUrl, setPixelatedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Apply pixelation when image URL or pixel size changes
  useEffect(() => {
    if (!imageUrl || isGameOver) {
      setPixelatedImageUrl(null);
      return;
    }

    async function applyPixelation() {
      if (!imageUrl) return;

      try {
        setIsProcessing(true);
        const pixelated = await pixelateImage(imageUrl, pixelSize);
        setPixelatedImageUrl(pixelated);
      } catch (error) {
        console.error('Failed to pixelate artwork:', error);
        setPixelatedImageUrl(null);
      } finally {
        setIsProcessing(false);
      }
    }

    applyPixelation();
  }, [imageUrl, pixelSize, isGameOver]);

  const displayUrl = isGameOver || !pixelatedImageUrl ? imageUrl : pixelatedImageUrl;

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
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
            <p className="text-sm text-muted-foreground">Processing...</p>
          </div>
        )}
        <AspectRatio ratio={16 / 9}>
          <div className="relative w-full h-full">
            <Image
              src={displayUrl || imageUrl}
              alt="Game artwork"
              fill
              className="object-contain rounded-lg"
              priority
            />
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
              fill
              className="object-contain"
            />
          </div>
        </DialogContent>
      </Dialog> */}
    </>
  );
}
