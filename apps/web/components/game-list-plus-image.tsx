'use client';

import { useState } from 'react';
import { MAX_ATTEMPTS, useCoverArtGame } from '@/lib/hooks/use-cover-art-game';
import ArtworkDisplay from '@/components/artwork-display';
import CoverDisplay from '@/components/cover-display';
import GameSearch from '@/components/game-search';
import SelectedGameDisplay from '@/components/selected-game-display';
import GuessHistoryInline from '@/components/guess-history-inline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getGameModeBySlug } from '@/lib/game-mode';
import Link from 'next/link';
import { MoveLeft } from 'lucide-react';
import Attempts from '@/components/attempts';
import DevModeToggle from '@/components/dev-mode-toggle';
import type { CoverArtModeSlug } from '@gaeldle/types/game';

interface GameListPlusImageProps {
  gameModeSlug: CoverArtModeSlug;
}

export default function GameListPlusImage(props: Readonly<GameListPlusImageProps>) {
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
  const clarity = Math.min(100, Math.round(((MAX_ATTEMPTS - attemptsLeft) / MAX_ATTEMPTS) * 100));

  const imageDisplayComp = () => {
    let imageDisplayed;

    switch (props.gameModeSlug) {
      case 'artwork':
        imageDisplayed =
          <ArtworkDisplay
            imageUrl={selectedArtworkUrl}
            pixelSize={currentPixelSize}
            isGameOver={isGameOver}
            isLoading={isLoading}
            className="h-full w-full"
          />
        break;
      case 'image-ai':
        imageDisplayed =
          <CoverDisplay
            game={targetGame}
            pixelSize={0}
            usePixelation={false}
            isGameOver={isGameOver}
            isLoading={isLoading}
            className="h-full w-full"
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
            isLoading={isLoading}
            className="h-full w-full"
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
        <p className="text-lg">Do not refresh or close the page</p>
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

        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card className="overflow-hidden border-border bg-card shadow-sm">
              <CardContent className="p-0">
                <div className="relative aspect-4/5 w-full bg-muted">
                  {imageDisplayComp()}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <GameSearch
                      key={searchKey}
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
                  <SelectedGameDisplay
                    selectedGame={selectedGame}
                    onClearSelection={clearSelection}
                    showSkeleton={!selectedGame}
                    className="w-full"
                    mode={props.gameModeSlug}
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clarity</span>
                  <span className="font-medium text-foreground">{clarity}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${clarity}%` }} />
                </div>
              </div>

              <GuessHistoryInline guesses={wrongGuesses} className="min-h-30" />

              <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} variant="primary" />

              {isGameOver && (
                <div className="rounded-xl border border-border bg-card/60 p-4 text-center">
                  {isCorrect ? (
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-green-600">Correct!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-destructive">Game Over!</p>
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

              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
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
      </div>
    </div>
  );
}
