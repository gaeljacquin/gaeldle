/**
 * Skeleton component for both artwork and cover displays
 */

import { Skeleton } from '@workspace/ui/skeleton';
import { cn } from '@workspace/ui/lib/utils';

interface ImageDisplaySkeletonProps {
  className?: string;
}

export default function ImageDisplaySkeleton({
  className,
}: ImageDisplaySkeletonProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center w-full h-full',
        className,
      )}
    >
      <Skeleton className="w-full h-full rounded-md" />
    </div>
  );
}
