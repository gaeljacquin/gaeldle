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
import { IconArrowLeft } from '@tabler/icons-react';
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
      <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xs uppercase tracking-[0.2em] animate-pulse">Initializing Protocol...</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Do not terminate session</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xs uppercase tracking-widest text-destructive">System Error</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          <IconArrowLeft className="size-3" />
          Return to Terminal
        </Link>

        <div className="mb-8 border-l-2 border-primary pl-4">
          <h1 className="text-2xl font-bold tracking-tight uppercase">{gameMode?.title}</h1>
          <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-widest">{gameMode?.description}</p>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <Card className="p-0 border shadow-none bg-muted/20">
                <div className="relative aspect-4/5 w-full">
                  {imageDisplayComp()}
                </div>
              </Card>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                  <span className="text-muted-foreground">Signal Clarity</span>
                  <span className="font-bold text-foreground">{clarity}%</span>
                </div>
                <div className="h-1 w-full bg-muted border">
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
                    className="cursor-pointer h-10 uppercase tracking-widest text-[10px] font-bold"
                    size="lg"
                  >
                    Transmit
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

              <div className="border p-4 bg-muted/5">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-muted-foreground">Recent Attempts</p>
                <GuessHistoryInline guesses={wrongGuesses} className="max-h-60" />
              </div>

              <div className="flex flex-col items-center gap-4 border p-4">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Attempt Authorization</p>
                 <Attempts maxAttempts={MAX_ATTEMPTS} attemptsLeft={attemptsLeft} variant="primary" />
              </div>

              {isGameOver && (
                <div className="border-2 border-primary bg-primary/5 p-6 text-center animate-in fade-in zoom-in duration-300">
                  {isCorrect ? (
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-primary uppercase tracking-tighter">Validation Successful</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Target correctly identified</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-destructive uppercase tracking-tighter">Mission Failed</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Target was: <span className="font-bold text-foreground">{targetGame?.name}</span>
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={resetGame}
                    className="mt-6 cursor-pointer uppercase tracking-widest text-[10px] font-bold"
                    size="lg"
                    variant={isCorrect ? "default" : "outline"}
                  >
                    {isCorrect ? 'New Mission' : 'Retry Protocol'}
                  </Button>
                </div>
              )}

              <div className="border border-dashed p-4 text-center opacity-50 hover:opacity-100 transition-opacity">
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
