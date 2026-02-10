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
    <div className="space-y-6 p-8 border-2 border-primary bg-primary/5 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col items-center gap-6">
        {targetGame?.imageUrl && (
          <div className="relative border-2 border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]">
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
            <h2 className="text-2xl font-bold text-primary uppercase tracking-tighter">Validation Successful</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Target correctly identified: <span className="text-foreground">{targetGame?.name}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-destructive uppercase tracking-tighter">Mission Failed</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Target was: <span className="text-foreground">{targetGame?.name}</span>
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button
          onClick={onPlayAgain}
          className="cursor-pointer uppercase tracking-widest text-[10px] font-bold px-8 h-10"
          size="lg"
        >
          {isCorrect ? 'New Mission' : 'Retry Protocol'}
        </Button>
        <Button
          onClick={onToggleTable}
          variant="outline"
          className="cursor-pointer uppercase tracking-widest text-[10px] font-bold px-8 h-10"
          size="lg"
        >
          {showingAnswer ? 'Show Log' : 'Show Answer'}
        </Button>
      </div>
    </div>
  );
}
