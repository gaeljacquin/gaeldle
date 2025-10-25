'use client';

import { MAX_ATTEMPTS, useCoverArtGame } from '@/lib/hooks/use-cover-art-game';
import { CoverDisplay } from '@/components/cover-display';
import { GameSelector } from '@/components/game-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getGameModeBySlug } from '@/lib/game-mode';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Attempts from '@/components/attempts';

export default function CoverArt2() {
  const gameMode = getGameModeBySlug('cover-art-2');

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
    handleSelectGame,
    handleSubmit,
    resetGame,
  } = useCoverArtGame({ mode: 'cover-art-2' });

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
            <CardTitle><ArrowLeft className="size-7" /></CardTitle>
            <CardDescription>
              Home
            </CardDescription>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {/* Left side - Cover Image */}
            <div className="flex-1 flex flex-col">
              <CoverDisplay
                game={targetGame}
                usePixelation={false}
                isGameOver={isGameOver}
                className="h-[500px]"
              />
              <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} />
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
                Submit
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
