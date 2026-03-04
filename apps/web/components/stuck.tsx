import { cn } from "@/lib/utils";

interface StuckProps {
  stuckState: 'none' | 'loading';
  className?: string
}

export default function Stuck({ stuckState, className }: Readonly<StuckProps>) {
  const loadingGameText = 'Loading game...';
  const stuckText = 'Stuck? Try refreshing the page 😅';

  if (stuckState === 'none') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-muted border',
          className
        )}
      >
        <p className="text-sm text-muted-foreground">{loadingGameText}</p>
        <p className="text-sm text-muted-foreground">{stuckText}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-2 text-center">
      <p className="text-lg">{loadingGameText}</p>
      <p className="text-muted-foreground">{stuckText}</p>
    </div>
  )
}
