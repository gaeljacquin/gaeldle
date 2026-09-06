import { Skeleton } from '@workspace/ui/skeleton';
import { Card } from '@workspace/ui/card';

export default function ClueSkeleton() {
  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="container mx-auto px-4 py-10">
        {/* Title + description */}
        <div className="relative mb-12">
          <div className="text-center pt-8 md:pt-0">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-4 w-80 mx-auto mt-2" />
            <div className="mt-4 flex gap-2 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="size-3 rounded-none" />
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl space-y-6">
          {/* Clue Card Skeleton */}
          <Card className="rounded-none border-2 border-border bg-card p-8 flex flex-col justify-center items-center min-h-48">
            <Skeleton className="h-4 w-11/12 mb-3" />
            <Skeleton className="h-4 w-10/12 mb-3" />
            <Skeleton className="h-4 w-8/12" />
          </Card>

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row items-stretch">
              <Skeleton className="flex-1 h-10" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
