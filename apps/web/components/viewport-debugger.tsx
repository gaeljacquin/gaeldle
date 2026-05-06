import { useEffect, useState } from 'react';
import { Separator } from '@workspace/ui/separator';

export default function ViewportDebugger() {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    rem:
      typeof window !== 'undefined'
        ? parseFloat(getComputedStyle(document.documentElement).fontSize)
        : 16,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getBreakpoint = (width: number) => {
    if (width >= 1536) return '2xl';
    if (width >= 1280) return 'xl';
    if (width >= 1024) return 'lg';
    if (width >= 768) return 'md';
    if (width >= 640) return 'sm';
    return 'xs';
  };

  const breakpoint = getBreakpoint(dimensions.width);

  return (
    <div className="flex items-center gap-2 border border-sky-500/30 bg-sky-500/10 px-3 py-1 shadow-sm">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-sm font-bold text-sky-600 dark:text-sky-400">
          <span className="uppercase">{breakpoint}</span>
          <span className="opacity-40 font-sans text-xs">|</span>
          <span>
            {dimensions.width} x {dimensions.height}
          </span>
        </div>
        <Separator className="opacity-30 text-sky-600 dark:text-sky-400" />
        <span className="text-center text-xs uppercase tracking-widest text-sky-600/70 dark:text-sky-400/70">
          1rem = {dimensions.rem}px
        </span>
      </div>
    </div>
  );
}
