import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonImage({ width, height }: { width: number, height: number }) {
  const inlineStyles = {
    height: `${height}px`,
    width: `${width}px`,
  };

  return (
    <div className="flex flex-col space-y-3">
      <Skeleton style={inlineStyles} className="rounded-xl" />
    </div>
  )
}
