import Image from 'next/image';
import { appInfo } from '@/lib/app-info';
import { cn } from '@/lib/utils';

interface AttemptsProps {
  maxAttempts: number;
  attemptsLeft: number;
  className?: string
}

export default function Attempts(props: AttemptsProps) {
  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      {[...Array(props.maxAttempts).keys()].map((i) => (
        <Image
          key={`attempt-${i + 1}`}
          src="/logo.png"
          alt={`${appInfo.title} Logo`}
          width={32}
          height={32}
          className={cn(
            props.attemptsLeft <= i && "grayscale",
            props.className,
          )}
          sizes='100vw'
        />
      ))}
    </div>
  )
}
