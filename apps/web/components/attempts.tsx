interface AttemptsProps {
  maxAttempts: number;
  attemptsLeft: number;
  className?: string;
  variant?: 'primary' | 'neutral';
}

export default function Attempts({
  maxAttempts,
  attemptsLeft,
  className,
  variant = 'primary',
}: Readonly<AttemptsProps>) {
  const attemptsUsed = maxAttempts - attemptsLeft;
  const emptyClass =
    variant === 'neutral'
      ? 'border-muted-foreground bg-transparent'
      : 'border-primary bg-primary';
  const usedClass = 'border-foreground/20 bg-foreground/10';

  return (
    <div className={`flex items-center justify-center gap-2 ${className ?? ''}`}>
      {Array.from({ length: maxAttempts }).map((_, index) => {
        const isUsed = index >= maxAttempts - attemptsUsed;
        return (
          <div
            key={`attempt-${index + 1}`}
            className={`h-3 w-3 rounded-none border transition-colors ${
              isUsed ? usedClass : emptyClass
            }`}
          />
        );
      })}
    </div>
  );
}
