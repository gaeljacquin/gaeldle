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
import { IconArrowLeft } from '@tabler/icons-react';
import Attempts from '@/components/attempts';
import SelectedGameDisplay from '@/components/selected-game-display';
import HintConfirmationModal from '@/components/hint-confirmation-modal';

export default function Specifications() {
  const gameMode = getGameModeBySlug('specifications');
  const [showAnswerSpecs, setShowAnswerSpecs] = useState(true);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);

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
    revealClue,
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
      <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xs uppercase tracking-[0.2em] animate-pulse">Initializing Protocol...</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Do not terminate session</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xs uppercase tracking-widest text-destructive">System Error</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{error}</p>
      </div>
    );
  }

  const wrongGuesses = guesses.map(g => g.gameId);

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          <IconArrowLeft className="size-3" />
          Return to Terminal
        </Link>

        <div className="mb-8 border-l-2 border-primary pl-4 text-left">
          <h1 className="text-2xl font-bold tracking-tight uppercase">{gameMode?.title}</h1>
          <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-widest">{gameMode?.description}</p>
        </div>

        <div className="mx-auto max-w-6xl space-y-8">
          {!isGameOver && (
            <div className="mx-auto flex max-w-2xl flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row items-stretch">
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
                  className="cursor-pointer h-10 uppercase tracking-widest text-[10px] font-bold px-8"
                  size="lg"
                >
                  Transmit
                </Button>
              </div>

              <SelectedGameDisplay
                selectedGame={selectedGame}
                onClearSelection={clearSelection}
                showSkeleton={!selectedGame}
                className="w-full bg-muted/10 border-dashed"
                mode="specifications"
              />
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Attempt Authorization</p>
              <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} variant="primary" />
            </div>

            {!isGameOver && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHintModalOpen(true)}
                disabled={attemptsLeft <= 1 || !!revealedClue}
                className="uppercase tracking-widest text-[10px] font-bold h-8 cursor-pointer"
              >
                {revealedClue ? 'Signal Intercepted' : 'Intercept Signal (-1 ATP)'}
              </Button>
            )}
          </div>

          <HintConfirmationModal
            isOpen={isHintModalOpen}
            onClose={() => setIsHintModalOpen(false)}
            onReveal={revealClue}
          />

          {!isGameOver && guesses.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] uppercase tracking-widest font-bold">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-600/50 border border-green-600"></div>
                <span className="text-muted-foreground">Match</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-yellow-600/50 border border-yellow-600"></div>
                <span className="text-muted-foreground">Partial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-destructive/50 border border-destructive"></div>
                <span className="text-muted-foreground">Null</span>
              </div>
            </div>
          )}

          {isGameOver && (
            <div className="mx-auto max-w-2xl">
              <SpecificationsGameOver
                isCorrect={isCorrect}
                targetGame={targetGame}
                attemptsUsed={MAX_ATTEMPTS - attemptsLeft}
                onPlayAgain={handleResetGame}
                onToggleTable={() => setShowAnswerSpecs(!showAnswerSpecs)}
                showingAnswer={showAnswerSpecs}
              />
            </div>
          )}

          <Card className="border shadow-none bg-muted/5 p-0 overflow-hidden">
            <CardContent className="p-0">
              <SpecificationsGrid
                guesses={guesses}
                revealedClue={revealedClue}
                targetGame={targetGame}
                showAnswerOnly={isGameOver ? showAnswerSpecs : false}
              />
            </CardContent>
          </Card>

          <div className="mx-auto max-w-md border border-dashed p-6 text-center opacity-50 hover:opacity-100 transition-opacity">
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
