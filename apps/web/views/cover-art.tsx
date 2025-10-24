'use client';

import { MAX_ATTEMPTS, useCoverArtGame } from '@/lib/hooks/use-cover-art-game';
import { CoverDisplay } from '@/components/cover-display';
import { GameSelector } from '@/components/game-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getGameModeBySlug } from '@/lib/game-mode';

export default function CoverArt() {
  const gameMode = getGameModeBySlug('cover-art');

  const {
    allGames,
    targetGame,
    selectedGameId,
    wrongGuesses,
    attemptsLeft,
    isGameOver,
    isCorrect,
    isLoading,
    error,
    currentPixelSize,
    handleSelectGame,
    handleSubmit,
    resetGame,
  } = useCoverArtGame({ mode: 'cover-art' });

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

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{gameMode?.title || 'Cover Art'}</CardTitle>
          <CardDescription>
            {gameMode?.description || 'Identify the game from their cover art.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {/* Left side - Cover Image */}
            <div className="flex-1 flex flex-col">
              <CoverDisplay
                game={targetGame}
                pixelSize={currentPixelSize}
                usePixelation={true}
                isGameOver={isGameOver}
                className="h-[500px]"
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Total attempts: <span className="font-semibold">{MAX_ATTEMPTS}</span>
                </p>
                {!isGameOver &&
                  <p className="text-sm text-muted-foreground">
                    Attempts left: <span className="font-semibold">{attemptsLeft}</span>
                  </p>
                }
              </div>
            </div>

            {/* Right side - Game selector and submit */}
            <div className="flex-1 flex flex-col gap-4">
              <GameSelector
                games={allGames}
                selectedGameId={selectedGameId}
                wrongGuesses={wrongGuesses}
                onSelectGame={handleSelectGame}
                disabled={isGameOver}
                className="h-[500px]"
              />
              <Button
                onClick={handleSubmit}
                disabled={selectedGameId === null || isGameOver}
                className="w-full cursor-pointer"
                size="lg"
              >
                Submit Guess
              </Button>
            </div>
          </div>

          {/* Game Over Message */}
          {isGameOver && (
            <div className="mt-6 text-center">
              {isCorrect ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">Correct!</p>
                  <p className="text-muted-foreground">
                    You guessed it with {attemptsLeft - 1} attempt{attemptsLeft - 1 !== 1 ? 's' : ''} remaining!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-red-600">Game Over!</p>
                  <p className="text-muted-foreground">
                    The game was: <span className="font-semibold">{targetGame?.name}</span>
                  </p>
                </div>
              )}
              <Button
                onClick={resetGame}
                className="mt-4 cursor-pointer"
                size="lg"
              >
                {isCorrect ? 'Keep Playing' : 'Play Again'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
