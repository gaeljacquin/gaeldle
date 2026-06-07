import { cn } from '@workspace/ui/lib/utils';

interface Timeline2CardSkeletonProps {
  className?: string;
}

export function Timeline2CardSkeleton({
  className,
}: Timeline2CardSkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 w-40 h-44 animate-pulse',
        className,
      )}
    >
      {/* Card body */}
      <div className="w-full rounded-md overflow-hidden border border-border">
        <div className="aspect-3/4 w-full bg-muted" />
        {/* Game name */}
        <div className="p-2 space-y-1.5">
          <div className="h-3 w-full rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
