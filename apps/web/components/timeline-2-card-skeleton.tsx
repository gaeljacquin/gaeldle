import { cn } from '@workspace/ui/lib/utils';

interface Timeline2CardSkeletonProps {
  className?: string;
  showTopBanner?: boolean;
}

export function Timeline2CardSkeleton({
  className,
  showTopBanner = true,
}: Timeline2CardSkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden border-2 border-border bg-card w-32 h-44 shrink-0 animate-pulse',
        className,
      )}
    >
      <div className="absolute inset-0 bg-muted/40" />
      {/* Date banner placeholder */}
      {showTopBanner && (
        <div className="absolute top-0 left-0 right-0 h-7 bg-muted" />
      )}
      {/* Name banner placeholder */}
      <div className="absolute inset-x-0 bottom-0 h-6 bg-muted border-t" />
    </div>
  );
}
