'use client';

import { VIEWPORT_DIMENSIONS_FALLBACK } from '@workspace/shared';
import { useSyncExternalStore } from 'react';

const subscribe = (callback: () => void) => {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
};

const getSnapshot = () => {
  return `${window.innerWidth}:${window.innerHeight}:${parseFloat(getComputedStyle(document.documentElement).fontSize)}`;
};

const getServerSnapshot = () => VIEWPORT_DIMENSIONS_FALLBACK;

export default function ViewportDebugger() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (snapshot === '0:0:16') {
    return null;
  }

  const [widthStr, heightStr] = snapshot.split(':');
  const width = parseInt(widthStr, 10);
  const height = parseInt(heightStr, 10);

  const getBreakpoint = (w: number) => {
    if (w >= 1536) {
      return '2xl';
    }

    if (w >= 1280) {
      return 'xl';
    }

    if (w >= 1024) {
      return 'lg';
    }

    if (w >= 768) {
      return 'md';
    }

    if (w >= 640) {
      return 'sm';
    }

    return 'xs';
  };

  const breakpoint = getBreakpoint(width);

  return (
    <div className="flex items-center gap-2 border border-sky-500/30 bg-sky-500/10 px-3 py-1 shadow-sm">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400">
          <span className="uppercase">{breakpoint}</span>
          <span className="opacity-40 font-sans">|</span>
          <span>
            {width} x {height}
          </span>
        </div>
      </div>
    </div>
  );
}
