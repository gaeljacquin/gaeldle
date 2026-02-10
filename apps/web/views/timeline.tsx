'use client';

import { MAX_ATTEMPTS, useTimelineGame } from '@/lib/hooks/use-timeline-game';
import { TimelineCard } from '@/components/timeline-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getGameModeBySlug } from '@/lib/game-mode';
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
import { useState } from 'react';
import type { Game } from '@gaeldle/types/game';
import Attempts from '@/components/attempts';
import { useTimelineStore } from '@/lib/stores/timeline-store';
import { motion } from 'motion/react';
import TimelineDevToggle from '@/components/timeline-dev-toggle';
import { cn } from '@/lib/utils';
import BackToMainMenu from '@/components/back-to-main-menu';

const noOpStrategy: SortingStrategy = () => {
  return null;
};

function SortableCard({
  game,
  isCorrect,
  showDate,
  disabled,
  isGameOver,
}: Readonly<{
  game: Game;
  isCorrect?: boolean;
  showDate?: boolean;
  disabled?: boolean;
  isGameOver?: boolean;
}>) {
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
      layout
      transition={{ duration: 0.3 }}
      {...attributes}
      {...(disabled ? {} : listeners)}
    >
      <TimelineCard
        game={game}
        isCorrect={isCorrect}
        showDate={showDate}
        isDragging={isDragging}
        isGameOver={isGameOver}
        className={disabled ? 'cursor-default' : 'cursor-grab'}
      />
    </motion.div>
  );
}

export default function Timeline() {
  const gameMode = getGameModeBySlug('timeline');
  const [activeId, setActiveId] = useState<number | null>(null);
  const { swapMode, setSwapMode } = useTimelineStore();

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
    })
  );

  function handleDragStart(e: DragStartEvent) {
    if (!(e.active?.id && typeof e.active.id === 'number')) {
      return;
    }

    setActiveId(e.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over) {
      return;
    }

    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = userOrder.findIndex((game) => game.id === active.id);
      const newIndex = userOrder.findIndex((game) => game.id === over.id);

      let newOrder: Game[];

      if (swapMode) {
        newOrder = [...userOrder];
        [newOrder[oldIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[oldIndex]];
      } else {
        newOrder = arrayMove(userOrder, oldIndex, newIndex);
      }

      handleReorder(newOrder);
    }

    setActiveId(null);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg">Loading game...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-bold">Error</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const activeGame = activeId ? userOrder.find((game) => game.id === activeId) : null;

  const hasMovedCorrectCard = hasSubmitted && userOrder.some((game, index) => {
    const wasCorrect = correctGameIds.has(game.id);
    const isInCorrectPosition = correctPositionMap.get(index) === game.id;
    return wasCorrect && !isInCorrectPosition;
  });

  const buttonsDisabled = isOrderSameAsSaved() || hasMovedCorrectCard;

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <BackToMainMenu />

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl uppercase">{gameMode?.title}</h1>
          <p className="mt-2 text-muted-foreground">{gameMode?.description}</p>
        </div>

        <Card className="border shadow-none bg-muted/5">
          <CardContent className="p-6">
            <div className="space-y-8">
              <div className="rounded-none border-2 border-dashed border-border p-6 overflow-x-auto flex justify-center bg-card/50">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                >
                  <SortableContext
                    items={userOrder.map((game) => game.id)}
                    strategy={swapMode ? noOpStrategy : horizontalListSortingStrategy}
                  >
                    <div className="flex gap-6 min-w-max px-4">
                      {userOrder.map((game, index) => {
                        let isCorrect: boolean | undefined = undefined;
                        let showDate = false;
                        let isLocked = false;

                        if (hasSubmitted) {
                          const wasCorrect = correctGameIds.has(game.id);
                          const isInCorrectPosition = correctPositionMap.get(index) === game.id;

                          if (wasCorrect && isInCorrectPosition) {
                            isCorrect = true;
                            showDate = true;
                            isLocked = true;
                          } else if (wasCorrect && !isInCorrectPosition) {
                            isCorrect = undefined;
                            showDate = true;
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
                            disabled={isLocked || isGameOver}
                            isGameOver={isGameOver}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeGame ? (
                      <TimelineCard game={activeGame} className="opacity-100 ring-2 ring-primary" />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-2 border p-1 bg-muted/20">
                  <button
                    onClick={() => setSwapMode(false)}
                    className={cn(
                      "px-6 py-2 text-sm font-bold transition-colors cursor-pointer",
                      swapMode ? "text-muted-foreground hover:text-foreground" : "bg-primary text-primary-foreground",
                    )}
                    disabled={isGameOver}
                  >
                    Shift
                  </button>
                  <button
                    onClick={() => setSwapMode(true)}
                    className={cn(
                      "px-6 py-2 text-sm font-bold transition-colors cursor-pointer",
                      swapMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                    disabled={isGameOver}
                  >
                    Swap
                  </button>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Attempts</p>
                  <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} variant="primary" />
                </div>
              </div>

              {!isGameOver && (
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    className="cursor-pointer font-bold px-8"
                    disabled={buttonsDisabled}
                  >
                    Submit
                  </Button>
                  <Button
                    onClick={handleResetToSaved}
                    size="lg"
                    variant="outline"
                    className="cursor-pointer font-bold px-8"
                    disabled={buttonsDisabled}
                  >
                    Reset
                  </Button>
                </div>
              )}

              {isGameOver && (
                <div className="mt-8 border border-border bg-card/60 p-8 text-center animate-in fade-in zoom-in duration-300">
                  {isWinner ? (
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-green-600">Congratulations!</p>
                      <p className="text-muted-foreground">
                        You arranged all games in the correct chronological order!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-destructive">Game Over!</p>
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
                    className="mt-8 cursor-pointer font-bold"
                    size="lg"
                  >
                    {isWinner ? 'Keep Playing' : 'Play Again'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto mt-8 max-w-md border border-dashed p-6 text-center opacity-70 hover:opacity-100 transition-opacity">
          <TimelineDevToggle
            getCorrectOrder={getCorrectOrder}
            attemptsLeft={attemptsLeft}
            maxAttempts={MAX_ATTEMPTS}
            onAdjustAttempts={adjustAttempts}
          />
        </div>
      </div>
    </div>
  );
}
