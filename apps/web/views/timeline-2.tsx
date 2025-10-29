'use client';

import { useTimeline2Game } from '@/lib/hooks/use-timeline-2-game';
import { Timeline2Card } from '@/components/timeline-2-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getGameModeBySlug } from '@/lib/game-mode';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { MoveLeft } from 'lucide-react';
import Attempts from '@/components/attempts';
import { motion, useMotionValue } from 'motion/react';
import { cn } from '@/lib/utils';
import Timeline2DevToggle from '@/components/timeline-2-dev-toggle';

export default function Timeline2() {
  const gameMode = getGameModeBySlug('timeline-2');
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const {
    timelineCards,
    dealtCard,
    attemptsLeft,
    maxAttempts,
    isGameOver,
    score,
    isLoading,
    lastPlacementCorrect,
    isAnimating,
    correctlyPlacedCards,
    isDealingCard,
    firstCardId,
    handleCardPlacement,
    resetGame,
    adjustAttempts,
  } = useTimeline2Game();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Find which drop zone the card is over
  const findDropZone = (clientX: number, clientY: number): number | null => {
    if (!timelineRef.current) return null;

    const timelineRect = timelineRef.current.getBoundingClientRect();

    // Check if cursor is within timeline bounds vertically
    if (clientY < timelineRect.top - 50 || clientY > timelineRect.bottom + 50) {
      return null;
    }

    const cards = timelineRef.current.querySelectorAll('[data-timeline-card]');

    if (cards.length === 0) return null;

    // For each card, check if cursor is before it
    for (let i = 0; i < cards.length; i++) {
      const cardRect = cards[i].getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;

      if (clientX < cardCenter) {
        return i;
      }
    }

    // If past all cards, insert at end
    return cards.length;
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => {
    const dropZone = findDropZone(info.point.x, info.point.y);
    setDraggedOverIndex(dropZone);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number }; offset: { x: number; y: number } }) => {
    // Only allow placement if dragged far enough (prevent accidental drops)
    const dragDistance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    const MIN_DRAG_DISTANCE = 40; // pixels

    if (dragDistance >= MIN_DRAG_DISTANCE) {
      const dropZone = findDropZone(info.point.x, info.point.y);

      if (dropZone !== null) {
        // Valid drop on timeline
        handleCardPlacement(dropZone);
      }
    }

    // Reset drag state
    setIsDragging(false);
    setDraggedOverIndex(null);
    x.set(0);
    y.set(0);
  };

  const getBannerColor = () => {
    if (isAnimating) {
      return lastPlacementCorrect === true ? 'green' : 'red';
    }
    return 'none';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-lg">Loading game...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-[1800px]">
      <Card className="relative">
        <Link
          href="/"
          className="absolute top-4 left-4 flex items-center gap-1 hover:underline"
        >
          <MoveLeft className="size-4" />
          <span className="text-sm">Main Menu</span>
        </Link>

        <CardHeader className="flex flex-col items-center justify-center text-center space-y-2 py-4">
          <CardTitle className="text-4xl font-bold">
            {gameMode?.title}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {gameMode?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex justify-center my-8">
              <div className="flex flex-col items-center">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex justify-center items-center w-[172px] h-[228px]">
                  {isDealingCard || isGameOver || !dealtCard ? (
                    <Skeleton className="w-[140px] h-[196px] rounded-lg" />
                  ) : (
                    <div className="relative">
                      {isDragging && (
                        <div className="absolute inset-0 opacity-50 pointer-events-none">
                          <Timeline2Card
                            game={dealtCard}
                            showDate={isAnimating}
                            bannerColor={getBannerColor()}
                          />
                        </div>
                      )}

                      <motion.div
                        drag
                        dragMomentum={false}
                        dragElastic={0.1}
                        onDragStart={handleDragStart}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                        style={{ x, y }}
                        className="cursor-grab active:cursor-grabbing touch-none"
                        initial={{ scale: 1 }}
                        whileDrag={{ scale: 1.05, zIndex: 50 }}
                        animate={isAnimating ? {
                          scale: [1, 0.95, 1],
                          transition: { duration: 0.3 }
                        } : {}}
                      >
                        <Timeline2Card
                          game={dealtCard}
                          showDate={isAnimating}
                          bannerColor={getBannerColor()}
                        />
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Attempts maxAttempts={maxAttempts} attemptsLeft={attemptsLeft} />

            <div className="text-center space-y-4">
              <div
                ref={timelineRef}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 overflow-x-auto flex justify-center items-center"
              >
                <div className="flex gap-4 items-center">
                  {timelineCards.map((game, index) => {
                    // First card (by ID) is always slate, others are green (correct) or red (incorrect)
                    const bannerColor = game.id === firstCardId
                      ? 'slate'
                      : correctlyPlacedCards.has(game.id)
                        ? 'green'
                        : 'red';

                    return (
                      <motion.div
                        key={game.id}
                        className="flex items-center"
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div
                          className={cn(
                            "transition-all duration-200",
                            isDragging && draggedOverIndex === index
                              ? "w-[148px] mx-2 border-2 border-dashed border-blue-500 rounded-lg h-[196px] bg-blue-50"
                              : "w-0"
                          )}
                        />

                        <div data-timeline-card>
                          <Timeline2Card
                            game={game}
                            showDate={true}
                            bannerColor={bannerColor}
                          />
                        </div>
                      </motion.div>
                    );
                  })}

                  <div
                    className={cn(
                      "transition-all duration-200",
                      isDragging && draggedOverIndex === timelineCards.length
                        ? "w-[148px] mx-2 border-2 border-dashed border-blue-500 rounded-lg h-[196px] bg-blue-50"
                        : "w-0"
                    )}
                  />
                </div>
              </div>
            </div>

            {isGameOver && (
              <div className="mt-6 text-center space-y-4">
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-red-600">Game Over!</p>
                  <p className="text-lg font-semibold">
                    Score: {score} card{score !== 1 ? 's' : ''} placed correctly
                  </p>
                </div>

                <Button
                  onClick={resetGame}
                  size="lg"
                  className="cursor-pointer"
                >
                  Play Again
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-center mt-4">
        <Timeline2DevToggle
          dealtCard={dealtCard}
          attemptsLeft={attemptsLeft}
          maxAttempts={maxAttempts}
          onAdjustAttempts={adjustAttempts}
        />
      </div>
    </div>
  );
}
