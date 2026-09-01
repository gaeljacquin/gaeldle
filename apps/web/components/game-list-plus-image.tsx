'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useCoverArtGame } from '@/lib/hooks/use-cover-art-game';
import ArtworkDisplay from '@/components/artwork-display';
import CoverDisplay from '@/components/cover-display';
import GameSearch from '@/components/game-search';
import GuessHistoryInline from '@/components/guess-history-inline';
import { Button } from '@workspace/ui/button';
import { Card } from '@workspace/ui/card';
import { Badge } from '@workspace/ui/badge';
import { IconX } from '@tabler/icons-react';
import Attempts from '@/components/attempts';
import DevModeToggle from '@/components/dev-mode-toggle';
import { gameModeSlugQueryOptions } from '@/lib/services/game-mode.service';

interface GameListPlusImageProps {
  gameModeSlug: string;
}

function ImageDisplay({
  slug,
  targetGame,
  currentPixelSize,
  selectedArtworkUrl,
  selectedAiImage,
  isGameOver,
  clueText,
}: {
  slug: string;
  targetGame: ReturnType<typeof useCoverArtGame>['targetGame'];
  currentPixelSize: number;
  selectedArtworkUrl: string | null;
  selectedAiImage: { url: string } | null;
  isGameOver: boolean;
  clueText: string | undefined;
}) {
  switch (slug) {
    case 'artwork':
      return (
        <ArtworkDisplay
          imageUrl={selectedArtworkUrl}
          pixelSize={currentPixelSize}
          isGameOver={isGameOver}
          className="size-full"
        />
      );
    case 'image-gen':
      return (
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
    case 'clue':
      if (!isGameOver) {
        return (
          <div className="size-full flex flex-col justify-center items-center p-8 bg-card select-text relative">
            <p className="font-serif text-lg md:text-xl leading-relaxed text-foreground text-center italic">
              &ldquo;{clueText ?? 'No clue available for this game.'}&rdquo;
            </p>
          </div>
        );
      } else {
        return (
          <CoverDisplay
            game={targetGame}
            pixelSize={0}
            usePixelation={false}
            isGameOver={isGameOver}
            className="size-full"
            sourceImageUrl={targetGame?.imageUrl}
            objectFit="cover"
          />
        );
      }
    default:
      return (
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
  }
}

export default function GameListPlusImage(props: GameListPlusImageProps) {
  const { data: gameMode } = useSuspenseQuery(
    gameModeSlugQueryOptions(props.gameModeSlug),
  );
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

  const clueText = (targetGame?.clue as { clue?: string } | null)?.clue;

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
            <div className="mt-4 flex justify-center">
              <Attempts
                maxAttempts={gameMode.maxAttempts}
                attemptsLeft={attemptsLeft}
                variant="primary"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4 w-full max-w-120 mx-auto lg:max-w-none">
              <Card className="p-0 border shadow-none bg-muted/20">
                <div className="relative aspect-4/5 w-full">
                  <ImageDisplay
                    slug={props.gameModeSlug}
                    targetGame={targetGame}
                    currentPixelSize={currentPixelSize}
                    selectedArtworkUrl={selectedArtworkUrl}
                    selectedAiImage={selectedAiImage}
                    isGameOver={isGameOver}
                    clueText={clueText}
                  />
                </div>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              {isGameOver ? (
                <div className="border border-border bg-card/60 p-4 text-center animate-in fade-in zoom-in duration-300">
                  {isCorrect ? (
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-green-600">
                        Correct!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
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
                    className="mt-5 cursor-pointer font-bold px-12"
                  >
                    {isCorrect ? 'Keep Playing' : 'Play Again'}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border border-dashed bg-muted/10 p-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectedGame?.imageUrl &&
                    props.gameModeSlug !== 'cover-art' ? (
                      <Image
                        src={selectedGame.imageUrl}
                        alt={selectedGame.name}
                        className="h-14 w-10 object-cover border shrink-0"
                        width={48}
                        height={64}
                        sizes="10vw"
                      />
                    ) : (
                      <div className="h-14 w-10 bg-muted flex items-center justify-center border shrink-0">
                        <span className="text-xs text-muted-foreground font-mono">
                          ?
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {selectedGame ? (
                        <Badge
                          variant="secondary"
                          className="h-10 rounded-full px-4 py-2 w-full flex items-center justify-between gap-2 max-w-full text-xs font-bold uppercase tracking-tight bg-muted/80 text-foreground border border-border"
                        >
                          <span className="truncate flex-1 min-w-0 text-left">
                            {selectedGame.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={clearSelection}
                            className="size-6 rounded-full cursor-pointer hover:bg-foreground/15 text-muted-foreground hover:text-foreground shrink-0"
                            aria-label="Clear selection"
                          >
                            <IconX className="size-3.5 pointer-events-none" />
                          </Button>
                        </Badge>
                      ) : (
                        <GameSearch
                          key={searchKey}
                          selectedGameId={selectedGameId}
                          wrongGuesses={wrongGuessIds}
                          onSelectGame={handleSelectGame}
                          disabled={isGameOver}
                          mode={props.gameModeSlug}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      onClick={handleSubmitWithClear}
                      disabled={selectedGameId === null || isGameOver}
                      className="cursor-pointer h-10 font-bold"
                      size="lg"
                    >
                      Submit
                    </Button>
                    <Button
                      onClick={handleSkipWithClear}
                      disabled={isGameOver}
                      className="cursor-pointer h-10 font-bold bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              )}

              <GuessHistoryInline
                guesses={wrongGuesses}
                targetGame={targetGame}
                className="max-h-full"
              />

              {isGameOver && props.gameModeSlug === 'clue' && (
                <div className="p-4 bg-muted/30 border border-border text-sm italic text-muted-foreground font-serif">
                  <p className="font-sans text-[10px] uppercase font-bold tracking-wider not-italic mb-1 text-muted-foreground/60">
                    Clue
                  </p>
                  &ldquo;
                  {clueText ?? 'No clue available.'}
                  &rdquo;
                </div>
              )}
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
