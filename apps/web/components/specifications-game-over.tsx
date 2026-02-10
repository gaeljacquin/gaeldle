'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { Game } from '@gaeldle/types/game';

interface SpecificationsGameOverProps {
  isCorrect: boolean;
  targetGame: Game | null;
  attemptsUsed: number;
  onPlayAgain: () => void;
  onToggleTable: () => void;
  showingAnswer?: boolean;
}

export default function SpecificationsGameOver({
  isCorrect,
  targetGame,
  onPlayAgain,
  onToggleTable,
  showingAnswer = true,
}: Readonly<SpecificationsGameOverProps>) {
  return (
    <div className="space-y-6 p-8 border border-border bg-muted/50">
      <div className="flex flex-col items-center gap-6">
        {targetGame?.imageUrl && (
          <div className="relative border-2 border-border shadow-lg">
            <Image
              src={targetGame.imageUrl}
              alt={targetGame.name}
              className="w-32 h-44 object-cover"
              width={128}
              height={176}
              sizes="10vw"
            />
          </div>
        )}

        {isCorrect ? (
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold text-green-600">Correct!</h2>
            <p className="text-md font-semibold">
              The game was: <span className="text-primary">{targetGame?.name}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold text-destructive">Game Over!</h2>
            <p className="text-md font-semibold">
              The game was: <span className="text-primary">{targetGame?.name}</span>
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button
          onClick={onPlayAgain}
          className="cursor-pointer font-bold px-8"
          size="lg"
        >
          {isCorrect ? 'Keep Playing' : 'Play Again'}
        </Button>
        <Button
          onClick={onToggleTable}
          variant="outline"
          className="cursor-pointer font-bold px-8"
          size="lg"
        >
          {showingAnswer ? 'Show My Guesses' : 'Show Answer'}
        </Button>
      </div>
    </div>
  );
}