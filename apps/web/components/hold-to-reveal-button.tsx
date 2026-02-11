'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HoldToRevealButtonProps {
  onReveal: () => void;
  disabled?: boolean;
  className?: string;
}

const HOLD_DURATION = 3000;

export default function HoldToRevealButton({ onReveal, disabled, className }: Readonly<HoldToRevealButtonProps>) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const startHolding = () => {
    if (disabled) return;

    setIsHolding(true);
    startTimeRef.current = 0;

    const updateProgress = (timestamp: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        onReveal();
        stopHolding();
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const stopHolding = () => {
    setIsHolding(false);
    setProgress(0);

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <Button
      onMouseDown={startHolding}
      onMouseUp={stopHolding}
      onMouseLeave={stopHolding}
      onTouchStart={startHolding}
      onTouchEnd={stopHolding}
      disabled={disabled}
      className={cn(
        'relative overflow-hidden cursor-pointer font-bold h-10',
        className
      )}
      size="lg"
      variant="outline"
    >
      <div
        className={cn(
          'absolute inset-0 bg-primary/20 transition-transform origin-left',
          isHolding ? 'duration-0' : 'duration-200'
        )}
        style={{
          transform: `scaleX(${progress / 100})`,
        }}
      />

      <span className="relative z-10">
        {isHolding ? `Holding (${Math.ceil((HOLD_DURATION - (progress / 100) * HOLD_DURATION) / 1000)}s)` : 'Hold to Reveal Hint'}
      </span>
    </Button>
  );
}