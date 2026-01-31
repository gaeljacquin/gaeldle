'use client';

import { useState } from 'react';
import { MAX_ATTEMPTS, useSpecificationsGame } from '@/lib/hooks/use-specifications-game';
import SpecificationsGrid from '@/components/specifications-grid';
import GameSearch from '@/components/game-search';
import DevModeToggle from '@/components/dev-mode-toggle';
import SpecificationsGameOver from '@/components/specifications-game-over';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getGameModeBySlug } from '@/lib/game-mode';
import Link from 'next/link';
import { MoveLeft } from 'lucide-react';
import Attempts from '@/components/attempts';
import SelectedGameDisplay from '@/components/selected-game-display';

export default function Specifications() {
  const gameMode = getGameModeBySlug('specifications');
  const [showAnswerSpecs, setShowAnswerSpecs] = useState(true);

  const {
    allGames,
    targetGame,
    selectedGameId,
    guesses,
    attemptsLeft,
    isGameOver,
    isCorrect,
    isLoading,
    error,
    revealedClue,
    clearSelection,
    handleSelectGame,
    handleSubmit,
    resetGame,
    adjustAttempts,
  } = useSpecificationsGame();

  const handleResetGame = () => {
    setShowAnswerSpecs(true);
    resetGame();
  };

  const selectedGame = allGames.find(g => g.id === selectedGameId) || null;

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

  const wrongGuesses = guesses.map(g => g.gameId);

  return (
    <div className="redesign min-h-full bg-background text-foreground">
      <div className="container mx-auto px-4 py-10">
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

        <div className="mx-auto max-w-6xl space-y-6">
          {!isGameOver && (
            <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <GameSearch
                  selectedGameId={selectedGameId}
                  wrongGuesses={wrongGuesses}
                  onSelectGame={handleSelectGame}
                  disabled={isGameOver}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={selectedGameId === null || isGameOver}
                className="cursor-pointer"
                size="lg"
              >
                Submit
              </Button>
            </div>
          )}

          {!isGameOver && (
            <div className="mx-auto flex max-w-2xl">
              <SelectedGameDisplay
                selectedGame={selectedGame}
                onClearSelection={clearSelection}
                showSkeleton={!selectedGame}
                className="flex-1"
                mode="specifications"
              />
            </div>
          )}

          <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} variant="primary" />

          {!isGameOver && guesses.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-green-500"></div>
                <span className="text-muted-foreground">Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-yellow-500"></div>
                <span className="text-muted-foreground">Partially correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-destructive"></div>
                <span className="text-muted-foreground">Incorrect</span>
              </div>
            </div>
          )}

          {isGameOver && (
            <SpecificationsGameOver
              isCorrect={isCorrect}
              targetGame={targetGame}
              attemptsUsed={MAX_ATTEMPTS - attemptsLeft}
              onPlayAgain={handleResetGame}
              onToggleTable={() => setShowAnswerSpecs(!showAnswerSpecs)}
              showingAnswer={showAnswerSpecs}
            />
          )}

          {!isGameOver && (
            <Card className="overflow-hidden border-border bg-card">
              <CardContent className="p-0">
                <SpecificationsGrid
                  guesses={guesses}
                  revealedClue={revealedClue}
                  targetGame={targetGame}
                />
              </CardContent>
            </Card>
          )}

          {isGameOver && (
            <Card className="overflow-hidden border-border bg-card">
              <CardContent className="p-0">
                <SpecificationsGrid
                  guesses={guesses}
                  revealedClue={revealedClue}
                  targetGame={targetGame}
                  showAnswerOnly={showAnswerSpecs}
                />
              </CardContent>
            </Card>
          )}

          <div className="mx-auto max-w-md rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
            <DevModeToggle
              targetGame={targetGame}
              attemptsLeft={attemptsLeft}
              maxAttempts={MAX_ATTEMPTS}
              onAdjustAttempts={adjustAttempts}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
