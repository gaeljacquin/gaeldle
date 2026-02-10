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
import Attempts from '@/components/attempts';
import SelectedGameDisplay from '@/components/selected-game-display';
import HintConfirmationModal from '@/components/hint-confirmation-modal';
import BackToMainMenu from '@/components/back-to-main-menu';

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

  const wrongGuesses = guesses.map(g => g.gameId);

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="container mx-auto px-4 py-10">
        <BackToMainMenu />

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl uppercase">{gameMode?.title}</h1>
          <p className="mt-2 text-muted-foreground">{gameMode?.description}</p>
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
                  className="cursor-pointer h-10 font-bold px-8"
                  size="lg"
                >
                  Submit
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
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Attempts</p>
              <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} variant="primary" />
            </div>

            {!isGameOver && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHintModalOpen(true)}
                disabled={attemptsLeft <= 1 || !!revealedClue}
                className="font-bold h-8 cursor-pointer"
              >
                {revealedClue ? 'Hint revealed' : 'Reveal Hint (-1 attempt)'}
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
                <span className="text-muted-foreground">Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-yellow-600/50 border border-yellow-600"></div>
                <span className="text-muted-foreground">Partially correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-destructive/50 border border-destructive"></div>
                <span className="text-muted-foreground">Incorrect</span>
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

          <div className="mx-auto max-w-md border border-dashed p-6 text-center opacity-70 hover:opacity-100 transition-opacity">
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
