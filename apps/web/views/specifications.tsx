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
import { ArrowLeft } from 'lucide-react';
import Attempts from '@/components/attempts';

const ATTEMPTS_REQUIRED_FOR_CLUE = 5;

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
  const incorrectAttempts = MAX_ATTEMPTS - attemptsLeft;
  const attemptsUntilClue = Math.max(0, ATTEMPTS_REQUIRED_FOR_CLUE - incorrectAttempts);
  const isClueEnabled = incorrectAttempts >= ATTEMPTS_REQUIRED_FOR_CLUE && !revealedClue && !isGameOver && attemptsLeft > 1;
  const selectedGame = allGames.find(g => g.id === selectedGameId) || null;

  const revealClueText = () => {
    if (!isGameOver && attemptsUntilClue > 0) {
      return (
        <p className="text-sm text-center text-muted-foreground">
          {attemptsUntilClue} more attempt{attemptsUntilClue !== 1 ? 's' : ''} until hint
        </p>
      )
    }

    return 'Reveal Hint';
  }


  return (
    <div className="container mx-auto">
      <div className="flex flex-col gap-8 p-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{gameMode?.title}</h1>
          <p className="text-lg text-muted-foreground">{gameMode?.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Link href="/" className="hover:underline">
            <CardTitle>
              <ArrowLeft className="size-7" />
            </CardTitle>
            <CardDescription>Home</CardDescription>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {/* Left sidebar - Guess History - Always visible */}
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

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Game Controls - Search and Actions */}
              {!isGameOver && (
                <div className="space-y-4 max-w-2xl mx-auto">
                  {/* Search Box */}
                  <SpecificationsSearch
                    games={allGames}
                    selectedGameId={selectedGameId}
                    wrongGuesses={wrongGuesses}
                    onSelectGame={handleSelectGame}
                    disabled={isGameOver}
                  />

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSubmit}
                        disabled={selectedGameId === null || isGameOver}
                        className="flex-1 cursor-pointer"
                        size="lg"
                      >
                        Submit
                      </Button>

                      <Button
                        onClick={() => setShowClueModal(true)}
                        disabled={!isClueEnabled}
                        className="flex-1 cursor-pointer"
                        size="lg"
                        variant={isClueEnabled ? 'default' : 'outline'}
                      >
                        {revealClueText()}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hint Confirmation Modal */}
              <HintConfirmationModal
                isOpen={showClueModal}
                onClose={() => setShowClueModal(false)}
                onReveal={revealClue}
              />

              {/* Attempts indicator */}
              <div className="max-w-2xl mx-auto">
                <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} />
              </div>

              {/* Legend */}
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

              {/* Game Over Screen */}
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

              {/* Specifications Grid */}
              {!isGameOver && (
                <SpecificationsGrid
                  guesses={guesses}
                  revealedClue={revealedClue}
                  targetGame={targetGame}
                />
              )}

              {/* Specifications Grid - Game Over shows answer or guesses based on toggle */}
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
