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
          </div>
        </div>

        <div className="mx-auto max-w-5xl space-y-6">
          {/* Clue Card Skeleton */}
          <Card className="rounded-none border-2 border-border bg-card p-8 flex flex-col justify-center items-center min-h-48">
            <Skeleton className="h-4 w-11/12 mb-3" />
            <Skeleton className="h-4 w-10/12 mb-3" />
            <Skeleton className="h-4 w-8/12" />
          </Card>

          {/* Controls & Attempts */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Guess & Search panel */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row items-stretch">
                <Skeleton className="flex-1 h-10" />
                <Skeleton className="h-10 w-24" />
              </div>
              <Skeleton className="h-14 w-full" />
            </div>

            {/* Attempts & Hints panel */}
            <div className="md:col-span-1 space-y-4">
              <div className="flex flex-col items-center gap-3 border p-4">
                <Skeleton className="h-3 w-20" />
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="size-8 rounded-full" />
                  ))}
                </div>
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
