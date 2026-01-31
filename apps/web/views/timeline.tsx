'use client';

import { MAX_ATTEMPTS, useTimelineGame } from '@/lib/hooks/use-timeline-game';
import { TimelineCard } from '@/components/timeline-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { cn } from '@/lib/utils';
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
}: {
  game: Game;
  isCorrect?: boolean;
  showDate?: boolean;
  disabled?: boolean;
  isGameOver?: boolean;
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
    if (!(e.active && e.active.id && typeof e.active.id === 'number')) {
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
            <div className="text-center space-y-2 mb-8">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 overflow-x-auto flex justify-center">
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
                            // Game is correct and in correct position: green + date
                            isCorrect = true;
                            showDate = true;
                            isLocked = true; // Lock cards in correct position
                          } else if (wasCorrect && !isInCorrectPosition) {
                            // Game was correct but moved: slate + date
                            isCorrect = undefined;
                            showDate = true;
                          } else {
                            // Game was never correct: red + "?"
                            isCorrect = false;
                            showDate = false;
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

              <div className="flex items-center justify-center gap-2 my-8">
                <Switch
                  id="swap-mode"
                  checked={swapMode}
                  onCheckedChange={setSwapMode}
                  disabled={isGameOver}
                  className={cn(
                    "data-[state=checked]:bg-green-700 data-[state=unchecked]:bg-red-700 relative inline-flex items-center rounded-full transition-colors"
                  )}
                />
                <Label htmlFor="swap-mode" className={cn(
                  "cursor-pointer",
                  !swapMode && 'text-muted-foreground'
                )}>
                  Swap
                </Label>
              </div>

              <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} />
            </div>

            {!isGameOver && (
              <div className="text-center flex gap-4 justify-center">
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
                      <p className="text-2xl font-bold text-red-600">Game Over!</p>
                      <p className="text-muted-foreground">
                        Here&apos;s the correct order:
                      </p>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 overflow-x-auto">
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
      <div className="flex items-center justify-center mt-4">
        <TimelineDevToggle
          getCorrectOrder={getCorrectOrder}
          attemptsLeft={attemptsLeft}
          maxAttempts={MAX_ATTEMPTS}
          onAdjustAttempts={adjustAttempts}
        />
      </div>
    </div>
  );
}
