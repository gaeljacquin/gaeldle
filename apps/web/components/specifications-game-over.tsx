import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { Game } from '@/lib/types/game';

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
}: SpecificationsGameOverProps) {
  return (
    <div className="space-y-4 p-6 bg-muted/50 rounded-lg border border-border">
      <div className="flex flex-col items-center gap-4">
        {targetGame?.imageUrl && (
          <div className="relative">
            <Image
              src={targetGame.imageUrl}
              alt={targetGame.name}
              className="w-32 h-44 object-cover rounded-lg border-2 border-border shadow-lg"
              width={128}
              height={176}
              sizes="100vw"
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
            <h2 className="text-3xl font-bold text-red-600">Game Over!</h2>
            <p className="text-md font-semibold">
              The game was: <span className="text-primary">{targetGame?.name}</span>
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-center">
        <Button
          onClick={onPlayAgain}
          className="cursor-pointer"
          size="lg"
        >
          {isCorrect ? 'Keep Playing' : 'Play Again'}
        </Button>
        <Button
          onClick={onToggleTable}
          variant="outline"
          className="cursor-pointer"
          size="lg"
        >
          {showingAnswer ? 'Show My Guesses' : 'Show Answer'}
        </Button>
      </div>
    </div>
  );
}
