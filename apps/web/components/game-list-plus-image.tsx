'use client';

import { useState } from 'react';
import { MAX_ATTEMPTS, useCoverArtGame } from '@/lib/hooks/use-cover-art-game';
import ArtworkDisplay from '@/components/artwork-display';
import CoverDisplay from '@/components/cover-display';
import GameSearch from '@/components/game-search';
import SelectedGameDisplay from '@/components/selected-game-display';
import GuessHistoryInline from '@/components/guess-history-inline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getGameModeBySlug } from '@/lib/game-mode';
import Link from 'next/link';
import { MoveLeft } from 'lucide-react';
import Attempts from '@/components/attempts';
import DevModeToggle from '@/components/dev-mode-toggle';
import { CoverArtModeSlug } from '@/lib/types/game';

interface GameListPlusImageProps {
  gameModeSlug: CoverArtModeSlug;
}

export default function GameListPlusImage(props: GameListPlusImageProps) {
  const gameMode = getGameModeBySlug(props.gameModeSlug);
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
    adjustAttempts,
  } = useCoverArtGame({ mode: props.gameModeSlug });

  const handleSubmitWithClear = () => {
    handleSubmit();
    setSearchKey(prev => prev + 1);
  };

  const selectedGame = allGames.find(g => g.id === selectedGameId) || null;
  const wrongGuessIds = wrongGuesses.map(g => g.id);

  const imageDisplayComp = () => {
    let imageDisplayed;

    switch (props.gameModeSlug) {
      case 'artwork':
        imageDisplayed =
          <ArtworkDisplay
            imageUrl={selectedArtworkUrl}
            pixelSize={currentPixelSize}
            isGameOver={isGameOver}
            className="h-[500px] border border-slate-200 rounded-lg"
          />
        break;
      case 'image-ai':
        imageDisplayed =
          <CoverDisplay
            game={targetGame}
            pixelSize={0}
            usePixelation={false}
            isGameOver={isGameOver}
            className="h-[500px]"
            sourceImageUrl={targetGame?.aiImageUrl}
          />
        break;
      default:
        imageDisplayed =
          <CoverDisplay
            game={targetGame}
            pixelSize={currentPixelSize}
            usePixelation={true}
            isGameOver={isGameOver}
            className="h-[500px]"
            sourceImageUrl={targetGame?.imageUrl}
          />
        break;
    }

    return imageDisplayed;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-2">
        <p className="text-lg">Loading game...</p>
        <p className="text-lg">Do not refresh the page</p>
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

  return (
    <div className="container mx-auto">
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
          <div className="flex gap-6">
            <div className="flex-1 flex flex-col">
              {imageDisplayComp()}
            </div>

            <div className="flex-1 flex flex-col gap-4 h-[500px]">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <GameSearch
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

              {!isGameOver && (
                <div className="flex gap-2">
                  <SelectedGameDisplay
                    selectedGame={selectedGame}
                    onClearSelection={clearSelection}
                    showSkeleton={!selectedGame}
                    className="flex-1"
                    mode={props.gameModeSlug}
                  />
                </div>
              )}

              <GuessHistoryInline guesses={wrongGuesses} className="flex-1 min-h-0" />

              <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} />
            </div>
          </div>

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
      <div className="flex items-center justify-center mt-4">
        <DevModeToggle
          targetGame={targetGame}
          attemptsLeft={attemptsLeft}
          maxAttempts={MAX_ATTEMPTS}
          onAdjustAttempts={adjustAttempts}
        />
      </div>
    </div>
  );
}
