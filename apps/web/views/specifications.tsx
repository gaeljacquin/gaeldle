'use client';

import { useState } from 'react';
import { MAX_ATTEMPTS, useSpecificationsGame } from '@/lib/hooks/use-specifications-game';
import { SpecificationsGrid } from '@/components/specifications-grid';
import { SpecificationsSearch } from '@/components/specifications-search';
import HintConfirmationModal from '@/components/hint-confirmation-modal';
import { GuessHistorySidebar } from '@/components/guess-history-sidebar';
import { SpecificationsGameOver } from '@/components/specifications-game-over';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getGameModeBySlug } from '@/lib/game-mode';
import Link from 'next/link';
import { MoveLeft } from 'lucide-react';
import Attempts from '@/components/attempts';

export default function Specifications() {
  const gameMode = getGameModeBySlug('specifications');
  const [showAnswerSpecs, setShowAnswerSpecs] = useState(true);
  const [showClueModal, setShowClueModal] = useState(false);

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
    handleSelectGame,
    clearSelection,
    handleSubmit,
    revealClue,
    resetGame,
    adjustAttempts,
  } = useSpecificationsGame();

  const handleResetGame = () => {
    setShowAnswerSpecs(true);
    resetGame();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading game...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const wrongGuesses = guesses.map(g => g.gameId);
  const selectedGame = allGames.find(g => g.id === selectedGameId) || null;

  return (
    <div className="container mx-auto">
      <Card className="relative">
        {/* Upper-left corner link */}
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
          <div className="flex gap-6">
            <div className="w-48">
              <GuessHistorySidebar
                guesses={guesses}
                isVisible={true}
                selectedGame={selectedGame}
                targetGame={targetGame}
                attemptsLeft={attemptsLeft}
                maxAttempts={MAX_ATTEMPTS}
                onAdjustAttempts={adjustAttempts}
                onClearSelection={clearSelection}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-6">
              {!isGameOver && (
                <div className="flex flex-row gap-4 max-w-2xl mx-auto">
                  <SpecificationsSearch
                    games={allGames}
                    selectedGameId={selectedGameId}
                    wrongGuesses={wrongGuesses}
                    onSelectGame={handleSelectGame}
                    disabled={isGameOver}
                  />

                  <Button
                    onClick={handleSubmit}
                    disabled={selectedGameId === null || isGameOver}
                    className="flex-1 cursor-pointer w-1/8"
                    size="lg"
                  >
                    Submit
                  </Button>
                </div>
              )}

              <HintConfirmationModal
                isOpen={showClueModal}
                onClose={() => setShowClueModal(false)}
                onReveal={revealClue}
              />

              <div className="max-w-2xl mx-auto">
                <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} />
              </div>

              {!isGameOver && guesses.length > 0 && (
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-600 rounded"></div>
                    <span>Correct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                    <span>Partially correct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-600 rounded"></div>
                    <span>Incorrect</span>
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
                <SpecificationsGrid
                  guesses={guesses}
                  revealedClue={revealedClue}
                  targetGame={targetGame}
                />
              )}

              {isGameOver && (
                <SpecificationsGrid
                  guesses={guesses}
                  revealedClue={revealedClue}
                  targetGame={targetGame}
                  showAnswerOnly={showAnswerSpecs}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
