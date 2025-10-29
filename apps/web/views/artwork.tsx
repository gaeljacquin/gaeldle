'use client';

import { useState } from 'react';
import { MAX_ATTEMPTS, useCoverArtGame } from '@/lib/hooks/use-cover-art-game';
import ArtworkDisplay from '@/components/artwork-display';
import SpecificationsSearch from '@/components/specifications-search';
import SelectedGameDisplay from '@/components/selected-game-display';
import GuessHistoryInline from '@/components/guess-history-inline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getGameModeBySlug } from '@/lib/game-mode';
import Link from 'next/link';
import { MoveLeft } from 'lucide-react';
import Attempts from '@/components/attempts';

export default function Artwork() {
  const gameMode = getGameModeBySlug('artwork');
  const [searchKey, setSearchKey] = useState(0);

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
    selectedArtworkUrl,
    handleSelectGame,
    clearSelection,
    handleSubmit,
    resetGame,
  } = useCoverArtGame({ mode: 'artwork' });

  const handleSubmitWithClear = () => {
    handleSubmit();
    setSearchKey(prev => prev + 1);
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

  const selectedGame = allGames.find(g => g.id === selectedGameId) || null;
  const wrongGuessIds = wrongGuesses.map(g => g.id);

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

        {/* Centered content */}
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
            {/* Left side - Artwork Image */}
            <div className="flex-1 flex flex-col">
              <ArtworkDisplay
                imageUrl={selectedArtworkUrl}
                pixelSize={currentPixelSize}
                isGameOver={isGameOver}
                className="h-[500px] border border-slate-200 rounded-lg"
              />
            </div>

            {/* Right side - Controls */}
            <div className="flex-1 flex flex-col gap-4 h-[500px]">
              {/* Attempts at top */}
              <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} />

              {/* Search box */}
              {!isGameOver && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <SpecificationsSearch
                      key={searchKey}
                      games={allGames}
                      selectedGameId={selectedGameId}
                      wrongGuesses={wrongGuessIds}
                      onSelectGame={handleSelectGame}
                      disabled={isGameOver}
                    />
                  </div>
                  <Button
                    onClick={handleSubmitWithClear}
                    disabled={selectedGameId === null || isGameOver}
                    className="cursor-pointer"
                    size="lg"
                  >
                    Submit
                  </Button>
                </div>
              )}

              {/* Selected game */}
              {!isGameOver && (
                <div className="flex gap-2">
                  <SelectedGameDisplay
                    selectedGame={selectedGame}
                    onClearSelection={clearSelection}
                    showSkeleton={!selectedGame}
                    className="flex-1"
                  />
                </div>
              )}

              {/* Guess history */}
              <GuessHistoryInline guesses={wrongGuesses} className="flex-1 min-h-0" />
            </div>
          </div>

          {/* Game Over Message */}
          {isGameOver && (
            <div className="mt-6 text-center">
              {isCorrect ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">Correct!</p>
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
