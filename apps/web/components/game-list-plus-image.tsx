'use client';

import { useState } from 'react';
import { MAX_ATTEMPTS, useCoverArtGame } from '@/lib/hooks/use-cover-art-game';
import ArtworkDisplay from '@/components/artwork-display';
import CoverDisplay from '@/components/cover-display';
import GameSearch from '@/components/game-search';
import SelectedGameDisplay from '@/components/selected-game-display';
import GuessHistoryInline from '@/components/guess-history-inline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getGameModeBySlug } from '@/lib/game-mode';
import Attempts from '@/components/attempts';
import DevModeToggle from '@/components/dev-mode-toggle';
import type { CoverArtModeSlug } from '@gaeldle/api-contract';
import BackToMainMenu from '@/components/back-to-main-menu';

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
  } = useCoverArtGame(props.gameModeSlug);

  const handleSubmitWithClear = () => {
    handleSubmit();
    setSearchKey(prev => prev + 1);
  };

  const selectedGame = allGames.find((game) => game.id === selectedGameId) || null;
  const wrongGuessIds = wrongGuesses.map(game => game.id);
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
      <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg">Loading game...</p>
        <p className="text-muted-foreground">Stuck? Try refreshing the page 😅</p>
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

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="container mx-auto px-4 py-10">
        <BackToMainMenu />

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl uppercase">{gameMode?.title}</h1>
          <p className="mt-2 text-muted-foreground">{gameMode?.description}</p>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <Card className="p-0 border shadow-none bg-muted/20">
                <div className="relative aspect-4/5 w-full">
                  {imageDisplayComp()}
                </div>
              </Card>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Clarity</span>
                  <span className="font-bold text-foreground">{clarity}%</span>
                </div>
                <div className="h-2 w-full bg-muted border overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${clarity}%` }} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row items-stretch">
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
                    className="cursor-pointer h-10 font-bold"
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
                    className="w-full bg-muted/10 border-dashed"
                    mode={props.gameModeSlug}
                  />
                )}
              </div>

              <GuessHistoryInline guesses={wrongGuesses} className="max-h-60" />

              <div className="flex flex-col items-center gap-4 border p-4">
                 <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Attempts</p>
                 <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} variant="primary" />
              </div>

              {isGameOver && (
                <div className="border border-border bg-card/60 p-6 text-center animate-in fade-in zoom-in duration-300">
                  {isCorrect ? (
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-green-600">Correct!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-destructive">Game Over!</p>
                      <p className="text-muted-foreground">
                        The game was: <span className="font-bold text-foreground">{targetGame?.name}</span>
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={resetGame}
                    className="mt-6 cursor-pointer font-bold"
                    size="lg"
                  >
                    {isCorrect ? 'Keep Playing' : 'Play Again'}
                  </Button>
                </div>
              )}

              <div className="border border-dashed p-4 text-center opacity-70 hover:opacity-100 transition-opacity">
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
