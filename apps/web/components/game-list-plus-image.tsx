'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useCoverArtGame } from '@/lib/hooks/use-cover-art-game';
import ArtworkDisplay from '@/components/artwork-display';
import CoverDisplay from '@/components/cover-display';
import GameSearch from '@/components/game-search';
import SelectedGameDisplay from '@/components/selected-game-display';
import GuessHistoryInline from '@/components/guess-history-inline';
import { Button } from '@workspace/ui/button';
import { Card } from '@workspace/ui/card';
import Attempts from '@/components/attempts';
import DevModeToggle from '@/components/dev-mode-toggle';
import { gameModeSlugQueryOptions } from '@/lib/services/game-mode.service';

interface GameListPlusImageProps {
  gameModeSlug: string;
}

export default function GameListPlusImage(props: GameListPlusImageProps) {
  const { data: gameMode } = useSuspenseQuery(
    gameModeSlugQueryOptions(props.gameModeSlug),
  );

  if (!gameMode) {
    throw new Error(`Game mode "${props.gameModeSlug}" not found`);
  }

  const [searchKey, setSearchKey] = useState(0);

  const {
    targetGame,
    selectedGame,
    wrongGuesses,
    attemptsLeft,
    isGameOver,
    isCorrect,
    error,
    currentPixelSize,
    selectedArtworkUrl,
    selectedAiImage,
    handleSelectGame,
    clearSelection,
    handleSubmit,
    handleSkip,
    resetGame,
    adjustAttempts,
  } = useCoverArtGame(props.gameModeSlug);

  const handleSubmitWithClear = () => {
    handleSubmit();
    setSearchKey((prev) => prev + 1);
  };

  const handleSkipWithClear = () => {
    handleSkip();
    setSearchKey((prev) => prev + 1);
  };

  const selectedGameId = selectedGame?.id ?? null;
  const wrongGuessIds = wrongGuesses
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .map((g) => g.id);

  const imageDisplayComp = () => {
    let imageDisplayed;

    switch (props.gameModeSlug) {
      case 'artwork':
        imageDisplayed = (
          <ArtworkDisplay
            imageUrl={selectedArtworkUrl}
            pixelSize={currentPixelSize}
            isGameOver={isGameOver}
            className="size-full"
          />
        );
        break;
      case 'image-gen':
        imageDisplayed = (
          <CoverDisplay
            game={targetGame}
            pixelSize={0}
            usePixelation={false}
            isGameOver={isGameOver}
            className="size-full"
            sourceImageUrl={selectedAiImage?.url ?? targetGame?.aiImageUrl}
            objectFit="cover"
          />
        );
        break;
      default:
        imageDisplayed = (
          <CoverDisplay
            game={targetGame}
            pixelSize={currentPixelSize}
            usePixelation={true}
            isGameOver={isGameOver}
            className="size-full"
            sourceImageUrl={targetGame?.imageUrl}
            objectFit="cover"
          />
        );
        break;
    }

    return imageDisplayed;
  };

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
        <div className="relative mb-12">
          <div className="text-center pt-8 md:pt-0">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl uppercase">
              {gameMode?.title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {gameMode?.description}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4 w-full max-w-120 mx-auto lg:max-w-none">
              <Card className="p-0 border shadow-none bg-muted/20">
                <div className="relative aspect-4/5 w-full">
                  {imageDisplayComp()}
                </div>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-4 border p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Attempts
                  </p>
                  <Attempts
                    maxAttempts={gameMode.maxAttempts}
                    attemptsLeft={attemptsLeft}
                    variant="primary"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row items-stretch">
                  <div className="flex-1">
                    <GameSearch
                      key={searchKey}
                      selectedGameId={selectedGameId}
                      wrongGuesses={wrongGuessIds}
                      onSelectGame={handleSelectGame}
                      disabled={isGameOver}
                      mode={props.gameModeSlug}
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
                  {(props.gameModeSlug === 'cover-art' ||
                    props.gameModeSlug === 'artwork') && (
                    <Button
                      onClick={handleSkipWithClear}
                      disabled={isGameOver}
                      className="cursor-pointer h-10 font-bold bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      Skip
                    </Button>
                  )}
                </div>
                {isGameOver ? null : (
                  <SelectedGameDisplay
                    selectedGame={selectedGame}
                    onClearSelection={clearSelection}
                    className="w-full bg-muted/10 border-dashed"
                    mode={props.gameModeSlug}
                  />
                )}
              </div>

              <GuessHistoryInline guesses={wrongGuesses} className="max-h-60" />

              {isGameOver ? (
                <div className="border border-border bg-card/60 p-6 text-center animate-in fade-in zoom-in duration-300">
                  {isCorrect ? (
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-green-600">
                        Correct!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-destructive">
                        Game Over!
                      </p>
                      <p className="text-muted-foreground">
                        The game was:{' '}
                        <span className="font-bold text-foreground">
                          {targetGame?.name}
                        </span>
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={resetGame}
                    size="lg"
                    className="mt-8 cursor-pointer font-bold px-12"
                  >
                    {isCorrect ? 'Keep Playing' : 'Play Again'}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center text-center opacity-70 hover:opacity-100 transition-opacity mt-8">
          <DevModeToggle
            targetGame={targetGame}
            attemptsLeft={attemptsLeft}
            maxAttempts={gameMode.maxAttempts}
            onAdjustAttempts={adjustAttempts}
            className="border-2 border-dashed w-full p-4"
          />
        </div>
      </div>
    </div>
  );
}
