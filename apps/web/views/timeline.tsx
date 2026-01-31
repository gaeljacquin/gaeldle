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
import Link from 'next/link';
import { MoveLeft } from 'lucide-react';
import Attempts from '@/components/attempts';
import { useTimelineStore } from '@/lib/stores/timeline-store';
import { motion } from 'motion/react';
import TimelineDevToggle from '@/components/timeline-dev-toggle';

// No-op strategy for swap mode - prevents automatic reordering animation
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
        // In swap mode, swap the two cards directly
        newOrder = [...userOrder];
        [newOrder[oldIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[oldIndex]];
      } else {
        // In normal mode, shift cards to make room
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
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading game...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-2">
        <p className="text-lg">Error</p>
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  const activeGame = activeId ? userOrder.find((game) => game.id === activeId) : null;

  // Check if any correct card has been moved from its correct position
  const hasMovedCorrectCard = hasSubmitted && userOrder.some((game, index) => {
    const wasCorrect = correctGameIds.has(game.id);
    const isInCorrectPosition = correctPositionMap.get(index) === game.id;
    return wasCorrect && !isInCorrectPosition;
  });

  const buttonsDisabled = isOrderSameAsSaved() || hasMovedCorrectCard;

  return (
    <div className="redesign min-h-full bg-background text-foreground">
      <div className="container mx-auto max-w-450 px-4 py-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <MoveLeft className="size-4" />
          Main Menu
        </Link>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{gameMode?.title}</h1>
          <p className="mt-2 text-muted-foreground">{gameMode?.description}</p>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="rounded-xl border-2 border-dashed border-border p-4 overflow-x-auto flex justify-center bg-card">
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
                    <div className="flex gap-4">
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
                      <TimelineCard game={activeGame} className="opacity-100" />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => setSwapMode(!swapMode)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    swapMode
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  disabled={isGameOver}
                >
                  Swap
                </button>

                <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} variant="primary" />
              </div>

              {!isGameOver && (
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    className="cursor-pointer"
                    disabled={buttonsDisabled}
                  >
                    Submit
                  </Button>
                  <Button
                    onClick={handleResetToSaved}
                    size="lg"
                    variant="outline"
                    className="cursor-pointer"
                    disabled={buttonsDisabled}
                  >
                    Reset
                  </Button>
                </div>
              )}

              {isGameOver && (
                <div className="mt-6 text-center space-y-4">
                  {isWinner ? (
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-green-600">Congratulations!</p>
                      <p className="text-muted-foreground">
                        You arranged all games in the correct chronological order!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-destructive">Game Over!</p>
                        <p className="text-muted-foreground">
                          Here&apos;s the correct order:
                        </p>
                      </div>

                      <div className="rounded-xl border-2 border-dashed border-border p-4 overflow-x-auto bg-card">
                        <div className="flex gap-4 min-w-max">
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
                    className="mt-4 cursor-pointer"
                    size="lg"
                  >
                    {isWinner ? 'Keep Playing' : 'Play Again'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto mt-6 max-w-md rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
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
