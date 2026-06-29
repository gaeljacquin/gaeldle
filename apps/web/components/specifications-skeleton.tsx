import { Skeleton } from '@workspace/ui/skeleton';
import { Card, CardContent } from '@workspace/ui/card';

export default function SpecificationsSkeleton() {
  const columnHeaders = [
    'Name',
    'Platforms',
    'Genres',
    'Themes',
    'Release year',
    'Game mode',
    'Game engines',
    'Publisher',
    'Perspective',
  ];

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

        <div className="mx-auto max-w-screen-2xl space-y-8">
          {/* Search + Submit input row */}
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row items-stretch">
              <Skeleton className="flex-1 h-10" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-14 w-full" />
          </div>

          {/* Attempts tracker */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <div className="flex gap-1.5 justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="size-8 rounded-full" />
                ))}
              </div>
            </div>
            {/* Reveal hint button */}
            <Skeleton className="h-8 w-40" />
          </div>

          {/* Specifications table card placeholder */}
          <Card className="border shadow-none bg-muted/5 p-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full border border-border/50 bg-card/5">
                <table className="w-full border-collapse min-w-max">
                  <thead>
                    <tr className="bg-slate-700">
                      {columnHeaders.map((header, i) => (
                        <th
                          key={i}
                          className="border border-border/50 px-3 py-2 text-sm font-semibold text-slate-100 text-center min-w-30"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render a few skeleton rows to mimic empty/guesses rows */}
                    {Array.from({ length: 2 }).map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="border border-border/50 p-0 w-32">
                          <div className="relative w-32 h-44 bg-muted/20 flex flex-col justify-end p-2">
                            <Skeleton className="h-3 w-full" />
                          </div>
                        </td>
                        {Array.from({ length: 8 }).map((_, colIndex) => (
                          <td
                            key={colIndex}
                            className="border border-border/50 px-3 py-2 text-center"
                          >
                            <div className="flex flex-col gap-1.5 items-center">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-3 w-12" />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* DevToggle skeleton */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mx-auto border-2 border-dashed w-full p-6 text-center opacity-70">
              <Skeleton className="h-8 w-48 mx-auto" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
