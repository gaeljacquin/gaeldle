'use client';

import { useTimeline2Game } from '@/lib/hooks/use-timeline-2-game';
import { Timeline2Card } from '@/components/timeline-2-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getGameModeBySlug } from '@/lib/game-mode';
import { useState, useRef } from 'react';
import Attempts from '@/components/attempts';
import { motion, useMotionValue } from 'motion/react';
import { cn } from '@/lib/utils';
import Timeline2DevToggle from '@/components/timeline-2-dev-toggle';
import BackToMainMenu from '@/components/back-to-main-menu';

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

  const findDropZone = (clientX: number, clientY: number): number | null => {
    if (!timelineRef.current) return null;

    const timelineRect = timelineRef.current.getBoundingClientRect();

    if (clientY < timelineRect.top - 50 || clientY > timelineRect.bottom + 50) {
      return null;
    }

    const cards = timelineRef.current.querySelectorAll('[data-timeline-card]');

    if (cards.length === 0) return null;

    for (let i = 0; i < cards.length; i++) {
      const cardRect = cards[i].getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;

      if (clientX < cardCenter) {
        return i;
      }
    }

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
    const dragDistance = Math.hypot(info.offset.x, info.offset.y);
    const MIN_DRAG_DISTANCE = 40;

    if (dragDistance >= MIN_DRAG_DISTANCE) {
      const dropZone = findDropZone(info.point.x, info.point.y);

      if (dropZone !== null) {
        handleCardPlacement(dropZone);
      }
    }

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
      <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg">Loading game...</p>
        <p className="text-muted-foreground">Stuck? Try refreshing the page 😅</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="container mx-auto max-w-450 px-4 py-10">
        <BackToMainMenu />

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl uppercase">{gameMode?.title}</h1>
          <p className="mt-2 text-muted-foreground">{gameMode?.description}</p>
        </div>

        <Card className="border shadow-none bg-muted/5">
          <CardContent className="p-8">
            <div className="space-y-8">
              <div className="flex justify-center">
                <div className="border-2 border-dashed border-border p-4 flex justify-center items-center w-36 h-48 bg-card/50">
                  {isDealingCard || isGameOver || !dealtCard ? (
                    <div className="w-32 h-44 bg-muted animate-pulse border" />
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

              <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Attempts</p>
                  <Attempts maxAttempts={maxAttempts} attemptsLeft={attemptsLeft} variant="primary" />
              </div>

              <div className="text-center">
                <div
                  ref={timelineRef}
                  className="border-2 border-dashed border-border p-6 overflow-x-auto flex justify-center items-center bg-card/50 min-h-55"
                >
                  <div className="flex gap-4 items-center px-4">
                    {timelineCards.map((game, index) => {
                      const correctlyPlacedCardColor = correctlyPlacedCards.has(game.id)
                        ? 'green'
                        : 'red'
                      ;
                      const bannerColor = game.id === firstCardId
                        ? 'slate'
                        : correctlyPlacedCardColor
                      ;

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
                                ? "w-32 mx-2 border-2 border-dashed border-primary h-44 bg-primary/10"
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
                          ? "w-32 mx-2 border-2 border-dashed border-primary h-44 bg-primary/10"
                          : "w-0"
                      )}
                    />
                  </div>
                </div>
              </div>

              {isGameOver && (
                <div className="mt-8 border border-border bg-card/60 p-8 text-center animate-in fade-in zoom-in duration-300">
                  <div className="space-y-4">
                    <p className="text-2xl font-bold text-destructive">Game Over!</p>
                    <p className="text-lg font-semibold">
                      Score: {score} card{score === 1 ? '' : 's'} placed correctly
                    </p>
                  </div>

                  <Button
                    onClick={resetGame}
                    size="lg"
                    className="mt-8 cursor-pointer font-bold px-8"
                  >
                    Play Again
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto mt-8 max-w-md border border-dashed p-6 text-center opacity-70 hover:opacity-100 transition-opacity">
          <Timeline2DevToggle
            dealtCard={dealtCard}
            attemptsLeft={attemptsLeft}
            maxAttempts={maxAttempts}
            onAdjustAttempts={adjustAttempts}
          />
        </div>
      </div>
    </div>
  );
}
