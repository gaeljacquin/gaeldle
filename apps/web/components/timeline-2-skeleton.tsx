import { Skeleton } from '@workspace/ui/skeleton';
import { Card, CardContent } from '@workspace/ui/card';
import { TimelineCardSkeleton } from '@/components/timeline-card-skeleton';
import { Timeline2CardSkeleton } from '@/components/timeline-2-card-skeleton';

export default function Timeline2Skeleton() {
  return (
    <div className="min-h-full bg-background text-foreground animate-pulse">
      <div className="container mx-auto px-4 py-10">
        {/* Title + description */}
        <div className="relative mb-12">
          <div className="text-center pt-8 md:pt-0">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-4 w-80 mx-auto mt-2" />
          </div>
        </div>

        <Card className="border shadow-none bg-muted/5">
          <CardContent>
            <div className="space-y-20">
              {/* Dealt card section */}
              <div className="flex justify-center">
                <div className="border-2 border-dashed border-border p-4 flex justify-center items-center w-36 h-48 bg-card/50">
                  <Timeline2CardSkeleton className="animate-none" />
                </div>
              </div>

              {/* Attempts */}
              <div className="flex flex-col items-center gap-2 -mt-8">
                <Skeleton className="h-3 w-16" />
                <div className="flex gap-1.5 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="size-6 rounded-full" />
                  ))}
                </div>
              </div>

              {/* Placed cards timeline */}
              <div className="text-center">
                <div className="border-2 border-dashed border-border p-6 overflow-x-auto flex items-center bg-card/50 min-h-55">
                  <div className="flex gap-4 items-center px-4 mx-auto justify-center">
                    <TimelineCardSkeleton className="animate-none" />
                  </div>
                </div>
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
