import { Skeleton } from '@workspace/ui/skeleton';
import { Card } from '@workspace/ui/card';

export default function GameListPlusImageSkeleton() {
  return (
    <Card className="flex flex-col gap-4 p-4 w-full">
      {/* Title */}
      <Skeleton className="h-7 w-40 rounded-md" />

      {/* Description */}
      <Skeleton className="h-4 w-72 rounded-md" />

      {/* Image display area */}
      <Skeleton className="w-full aspect-square rounded-md" />

      {/* Attempts row */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16 rounded-md" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-5 rounded-full" />
          ))}
        </div>
      </div>

      {/* Search input */}
      <Skeleton className="h-10 w-full rounded-md" />

      {/* Submit / Skip buttons */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-20 rounded-md" />
      </div>
    </Card>
  );
}
