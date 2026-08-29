import { Skeleton } from '@workspace/ui/skeleton';
import { Card } from '@workspace/ui/card';

export default function GameListPlusImageSkeleton() {
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

        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* Left col — image card (aspect-4/5) */}
            <div className="flex flex-col gap-4 w-full max-w-120 mx-auto lg:max-w-none">
              <Card className="p-0 border shadow-none bg-muted/20">
                <Skeleton className="aspect-4/5 w-full" />
              </Card>
            </div>

            {/* Right col — controls */}
            <div className="flex flex-col gap-6">
              {/* Unified Search & Selection Card placeholder */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border border-dashed bg-muted/10 p-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="h-14 w-10 shrink-0" />
                  <Skeleton className="flex-1 h-10" />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-16" />
                </div>
              </div>

              {/* GuessHistoryInline placeholder */}
              <Skeleton className="h-20 w-full max-h-60" />
            </div>
          </div>
        </div>

        {/* DevModeToggle */}
        {process.env.NODE_ENV === 'development' && (
          <div className="flex items-center justify-center border-2 border-dashed p-4 text-center opacity-70 mt-8">
            <Skeleton className="h-8 w-48" />
          </div>
        )}
      </div>
    </div>
  );
}
