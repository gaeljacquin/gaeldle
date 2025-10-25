'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface HoldToRevealButtonProps {
  onReveal: () => void;
  disabled?: boolean;
  className?: string;
}

const HOLD_DURATION = 3000; // 3 seconds
const NOW = Date.now();

export function HoldToRevealButton({ onReveal, disabled, className }: HoldToRevealButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const startHolding = () => {
    if (disabled) return;

    setIsHolding(true);
    startTimeRef.current = NOW;

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Completed
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
        'relative overflow-hidden cursor-pointer',
        className
      )}
      size="lg"
    >
      {/* Fill animation background */}
      <div
        className={cn(
          'absolute inset-0 bg-primary-foreground/20 transition-transform origin-left',
          isHolding ? 'duration-0' : 'duration-200'
        )}
        style={{
          transform: `scaleX(${progress / 100})`,
        }}
      />

      {/* Button text */}
      <span className="relative z-10">
        {isHolding ? `Hold (${Math.ceil((HOLD_DURATION - (progress / 100) * HOLD_DURATION) / 1000)}s)` : 'Hold to Reveal Hint'}
      </span>
    </Button>
  );
}
