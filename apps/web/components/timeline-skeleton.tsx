import { Skeleton } from '@workspace/ui/skeleton';
import { Card, CardContent } from '@workspace/ui/card';
import { TimelineCardSkeleton } from '@/components/timeline-card-skeleton';
import { TIMELINE_GAMES_COUNT } from '@workspace/shared';

export default function TimelineSkeleton() {
  return (
    <div className="min-h-full bg-background text-foreground animate-pulse">
      <div className="container mx-auto py-10">
        {/* Title + description */}
        <div className="relative mb-12">
          <div className="text-center pt-8 md:pt-0">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-4 w-80 mx-auto mt-2" />
          </div>
        </div>

        <Card className="border shadow-none bg-muted/5">
          <CardContent>
            <div className="space-y-8">
              {/* Cards area */}
              <div className="rounded-none border-2 border-dashed border-border py-4 overflow-x-auto bg-card/50">
                <div className="flex gap-6 min-w-max px-2 mx-auto justify-center">
                  {Array.from({ length: TIMELINE_GAMES_COUNT }).map((_, i) => (
                    <TimelineCardSkeleton key={i} className="animate-none" />
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-center gap-6">
                {/* Mode toggle */}
                <div className="flex items-center gap-2 border p-1 bg-muted/20">
                  <div className="px-6 py-2 h-9 w-20 bg-muted/40 rounded-sm" />
                  <div className="px-6 py-2 h-9 w-20 bg-muted/40 rounded-sm" />
                </div>

                {/* Attempts */}
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-3 w-16" />
                  <div className="flex gap-1.5 justify-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="size-6 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit + Reset buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Skeleton className="h-11 w-28" />
                <Skeleton className="h-11 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dev Toggle */}
        <div className="mx-auto mt-8 border-2 border-dashed w-full p-6 text-center opacity-70">
          <Skeleton className="h-8 w-48 mx-auto" />
        </div>
      </div>
    </div>
  );
}
