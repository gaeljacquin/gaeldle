'use client';

import { Suspense, ViewTransition, useState, useEffect } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useTimelineGame } from '@/lib/hooks/use-timeline-game';
import { TimelineCard } from '@/components/timeline-card';
import { Button } from '@workspace/ui/button';
import { Card, CardContent } from '@workspace/ui/card';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  type SortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ErrorBoundary } from '@/components/error-boundary';
import TimelineSkeleton from '@/components/timeline-skeleton';
import type { Game } from '@workspace/api/db';
import Attempts from '@/components/attempts';
import { useTimelineStore } from '@/lib/stores/timeline-store';
import { motion } from 'motion/react';
import TimelineDevToggle from '@/components/timeline-dev-toggle';
import { cn } from '@workspace/ui/lib/utils';
import { TimelineCardSkeleton } from '@/components/timeline-card-skeleton';
import { TIMELINE_GAMES_COUNT } from '@workspace/shared';
import { gameModeSlugQueryOptions } from '@/lib/services/game-mode.service';

const noOpStrategy: SortingStrategy = () => {
  return null;
};

function SortableCard({
  game,
  isCorrect,
  showDate,
  isMovedFound,
  disabled,
  isGameOver,
  isSwapTarget,
  shouldAnimateLayout = true,
}: {
  game: Game;
  isCorrect?: boolean;
  showDate?: boolean;
  isMovedFound?: boolean;
  disabled?: boolean;
  isGameOver?: boolean;
  isSwapTarget?: boolean;
  shouldAnimateLayout?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: game.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={shouldAnimateLayout}
      transition={{ duration: 0.3 }}
      {...attributes}
      {...(disabled ? {} : listeners)}
    >
      <TimelineCard
        game={game}
        isCorrect={isCorrect}
        showDate={showDate}
        isMovedFound={isMovedFound}
        isDragging={isDragging}
        isGameOver={isGameOver}
        className={cn(
          disabled ? 'cursor-default' : 'cursor-grab',
          isSwapTarget &&
            'ring-2 ring-offset-2 ring-offset-background ring-primary/90 z-10',
        )}
      />
    </motion.div>
  );
}

function TimelineContent() {
  const { data: gameMode } = useSuspenseQuery(
    gameModeSlugQueryOptions('timeline'),
  );

  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [justDroppedId, setJustDroppedId] = useState<number | null>(null);
  const { swapMode, setSwapMode } = useTimelineStore();

  useEffect(() => {
    if (justDroppedId !== null) {
      const timer = setTimeout(() => {
        setJustDroppedId(null);
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [justDroppedId]);

  const {
    userOrder,
    correctGameIds,
    correctPositionMap,
    attemptsLeft,
    isGameOver,
    isWinner,
    isLoading,
    error,
    hasSubmitted,
    handleReorder,
    handleSubmit,
    handleResetToSaved,
    isOrderSameAsSaved,
    resetGame,
    getCorrectOrder,
    adjustAttempts,
  } = useTimelineGame();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as number);
  }

  function handleDragOver(e: DragOverEvent) {
    if (!e.over) {
      setOverId(null);
      return;
    }

    const overIdNum = Number(e.over.id);

    if (swapMode) {
      const overIndex = userOrder.findIndex((game) => game.id === overIdNum);
      const isOverLocked =
        hasSubmitted &&
        correctGameIds.has(overIdNum) &&
        correctPositionMap.get(overIndex) === overIdNum;

      if (isOverLocked) {
        setOverId(null);

        return;
      }

      setOverId(overIdNum);
    } else {
      setOverId(overIdNum);

      if (e.active && e.over && e.active.id !== e.over.id) {
        const oldIndex = userOrder.findIndex((game) => game.id === e.active.id);
        const newIndex = userOrder.findIndex((game) => game.id === e.over?.id);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newOrder = arrayMove(userOrder, oldIndex, newIndex);
          handleReorder(newOrder);
        }
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over) {
      setActiveId(null);
      setOverId(null);

      return;
    }

    const { active, over } = event;

    if (swapMode && active.id !== over?.id) {
      const oldIndex = userOrder.findIndex((game) => game.id === active.id);
      const newIndex = userOrder.findIndex((game) => game.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        setActiveId(null);
        setOverId(null);

        return;
      }

      const isOverLocked =
        hasSubmitted &&
        correctGameIds.has(over.id as number) &&
        correctPositionMap.get(newIndex) === over.id;

      if (isOverLocked) {
        setActiveId(null);
        setOverId(null);

        return;
      }

      const newOrder = [...userOrder];
      [newOrder[oldIndex], newOrder[newIndex]] = [
        newOrder[newIndex],
        newOrder[oldIndex],
      ];
      setJustDroppedId(active.id as number);
      handleReorder(newOrder);
    }

    setActiveId(null);
    setOverId(null);
  }

  function handleDragCancel() {
    setActiveId(null);
    setOverId(null);
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-bold">Error</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const activeGame = activeId
    ? userOrder.find((game) => game.id === activeId)
    : null;

  const hasMovedCorrectCard =
    hasSubmitted &&
    userOrder.some((game, index) => {
      const wasCorrect = correctGameIds.has(game.id);
      const isInCorrectPosition = correctPositionMap.get(index) === game.id;
      return wasCorrect && !isInCorrectPosition;
    });

  const submitDisabled = isOrderSameAsSaved() || hasMovedCorrectCard;
  const resetDisabled = isOrderSameAsSaved();

  return (
    <ViewTransition enter="slide-up">
      <div className="min-h-full bg-background text-foreground">
        <div className="max-w-[1600px] mx-auto px-4 py-10">
          <div className="relative mb-12">
            <div className="text-center pt-8 md:pt-0">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl uppercase">
                {gameMode.title}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {gameMode.description}
              </p>
              <div className="mt-4 flex justify-center">
                <Attempts
                  maxAttempts={gameMode.maxAttempts}
                  attemptsLeft={attemptsLeft}
                  variant="primary"
                />
              </div>
            </div>
          </div>

          <Card className="border shadow-none bg-muted/5">
            <CardContent>
              <div className="space-y-8">
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 border p-1 bg-muted/20 h-9">
                    <button
                      onClick={() => setSwapMode(false)}
                      className={cn(
                        'h-full flex items-center justify-center px-6 text-sm font-bold transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50',
                        swapMode
                          ? 'text-muted-foreground hover:text-foreground'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700',
                      )}
                      disabled={isGameOver}
                    >
                      Shift
                    </button>
                    <button
                      onClick={() => setSwapMode(true)}
                      className={cn(
                        'h-full flex items-center justify-center px-6 text-sm font-bold transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50',
                        swapMode
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                      disabled={isGameOver}
                    >
                      Swap
                    </button>
                  </div>
                </div>

                <div
                  className={cn(
                    'rounded-none border-2 border-dashed border-border py-4 overflow-x-auto scrollbar-x transition-colors duration-300',
                    swapMode
                      ? 'border-amber-600 dark:border-amber-400'
                      : 'border-indigo-400 dark:border-indigo-200',
                  )}
                >
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                  >
                    <SortableContext
                      items={userOrder.map((game) => game.id)}
                      strategy={
                        swapMode ? noOpStrategy : horizontalListSortingStrategy
                      }
                    >
                      <div className="flex gap-6 min-w-max px-2 mx-auto justify-center">
                        {userOrder.length === 0 && isLoading
                          ? Array.from({ length: TIMELINE_GAMES_COUNT }).map(
                              (_, i) => <TimelineCardSkeleton key={i} />,
                            )
                          : userOrder.map((game, index) => {
                              let isCorrect: boolean | undefined = undefined;
                              let showDate = false;
                              let isLocked = false;
                              let isMovedFound = false;

                              if (hasSubmitted) {
                                const wasCorrect = correctGameIds.has(game.id);
                                const isInCorrectPosition =
                                  correctPositionMap.get(index) === game.id;

                                if (wasCorrect && isInCorrectPosition) {
                                  isCorrect = true;
                                  showDate = true;
                                  isLocked = true;
                                } else if (wasCorrect && !isInCorrectPosition) {
                                  isCorrect = undefined;
                                  showDate = true;
                                  isMovedFound = true;
                                } else {
                                  isCorrect = false;
                                }
                              }

                              return (
                                <SortableCard
                                  key={game.id}
                                  game={game}
                                  isCorrect={isCorrect}
                                  showDate={showDate}
                                  isMovedFound={isMovedFound}
                                  disabled={isLocked || isGameOver}
                                  isGameOver={isGameOver}
                                  shouldAnimateLayout={
                                    game.id !== justDroppedId
                                  }
                                  isSwapTarget={
                                    swapMode &&
                                    !isLocked &&
                                    activeId !== null &&
                                    overId === game.id &&
                                    activeId !== game.id
                                  }
                                />
                              );
                            })}
                      </div>
                    </SortableContext>

                    <DragOverlay dropAnimation={null}>
                      {activeGame ? (
                        <TimelineCard
                          game={activeGame}
                          showDate={
                            hasSubmitted && correctGameIds.has(activeGame.id)
                          }
                          isMovedFound={
                            hasSubmitted && correctGameIds.has(activeGame.id)
                          }
                          className="opacity-100 shadow-xl"
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>

                {isGameOver ? null : (
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <Button
                      onClick={handleSubmit}
                      size="lg"
                      className="cursor-pointer font-bold px-8 text-sm"
                      disabled={submitDisabled}
                    >
                      Submit
                    </Button>
                    <Button
                      onClick={handleResetToSaved}
                      size="lg"
                      variant="outline"
                      className="cursor-pointer font-bold px-8 text-sm"
                      disabled={resetDisabled}
                    >
                      Reset
                    </Button>
                  </div>
                )}

                {isGameOver ? (
                  <div className="mt-8 border border-border bg-card/60 p-8 text-center animate-in fade-in zoom-in duration-300">
                    {isWinner ? (
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-green-600">
                          Congratulations!
                        </p>
                        <p className="text-muted-foreground">
                          You arranged all games in the correct chronological
                          order!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <p className="text-2xl font-bold text-destructive">
                            Game Over!
                          </p>
                          <p className="text-muted-foreground">
                            Here&apos;s the correct order:
                          </p>
                        </div>

                        <div className="rounded-none border-2 border-dashed border-border p-6 overflow-x-auto bg-card/50">
                          <div className="flex gap-6 min-w-max justify-center">
                            {getCorrectOrder().map((game) => (
                              <TimelineCard
                                key={game.id}
                                game={game}
                                isCorrect={true}
                                showDate={true}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={resetGame}
                      size="lg"
                      className="mt-8 cursor-pointer font-bold px-12"
                    >
                      {isWinner ? 'Keep Playing' : 'Play Again'}
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="mx-auto mt-8 text-center opacity-70 hover:opacity-100 transition-opacity">
            <TimelineDevToggle
              getCorrectOrder={getCorrectOrder}
              attemptsLeft={attemptsLeft}
              maxAttempts={gameMode.maxAttempts}
              onAdjustAttempts={adjustAttempts}
              className="border-2 border-dashed w-full p-6"
            />
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}

export default function Timeline() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <ViewTransition enter="slide-down">
            <TimelineSkeleton />
          </ViewTransition>
        }
      >
        <TimelineContent />
      </Suspense>
    </ErrorBoundary>
  );
}
