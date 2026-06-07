import { cn } from '@workspace/ui/lib/utils';

interface TimelineCardSkeletonProps {
  className?: string;
}

export function TimelineCardSkeleton({ className }: TimelineCardSkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 w-25 shrink-0 animate-pulse',
        className,
      )}
    >
      <div className="w-full rounded-md overflow-hidden border border-border">
        {/* Image + date badge share a relative container */}
        <div className="relative aspect-3/4 w-full bg-muted">
          {/* Date badge overlaid at top-center, same as the real card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-full bg-muted-foreground/30" />
        </div>
        {/* Game name */}
        <div className="p-2 space-y-1.5">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
