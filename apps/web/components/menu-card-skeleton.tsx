import { Skeleton } from '@workspace/ui/skeleton';

export function MenuCardSkeleton() {
  return (
    <div className="relative flex size-44 w-full flex-col justify-end overflow-hidden rounded-xl p-5 bg-slate-700">
      {/* Badge placeholder (top-left) */}
      <Skeleton className="absolute left-4 top-4 h-6 w-16 rounded-full" />

      {/* Icon placeholder (top-right) */}
      <Skeleton className="absolute right-4 top-4 h-9 w-9 rounded-lg" />

      {/* Title + description */}
      <div className="relative z-10 space-y-2">
        <Skeleton className="h-6 w-2/5 rounded-md" />
        <Skeleton className="h-4 w-3/4 rounded-md" />
      </div>
    </div>
  );
}
