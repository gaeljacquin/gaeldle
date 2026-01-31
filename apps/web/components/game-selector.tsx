'use client';

import { useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { Game } from '@gaeldle/types/game';

interface GameSelectorProps {
  games: Game[];
  selectedGameId: number | null;
  wrongGuesses: number[];
  onSelectGame: (gameId: number) => void;
  disabled?: boolean;
  className?: string;
}

export default function GameSelector({
  games,
  selectedGameId,
  wrongGuesses,
  onSelectGame,
  disabled = false,
  className,
}: Readonly<GameSelectorProps>) {
  const [searchValue, setSearchValue] = useState('');

  const handleSelect = (gameId: number) => {
    // Don't allow selecting wrong guesses
    if (wrongGuesses.includes(gameId) || disabled) return;
    onSelectGame(gameId);
  };

  return (
    <Command className={cn('border rounded-lg', className)}>
      <CommandInput
        placeholder="Search games..."
        value={searchValue}
        onValueChange={setSearchValue}
        disabled={disabled}
      />
      <CommandList className="max-h-full">
        <CommandEmpty>No games found.</CommandEmpty>
        <CommandGroup>
          {games.map((game) => {
            const isWrongGuess = wrongGuesses.includes(game.id);
            const isSelected = selectedGameId === game.id;
            const isDisabled = isWrongGuess || disabled;

            return (
              <CommandItem
                key={game.id}
                value={game.name}
                onSelect={() => handleSelect(game.id)}
                disabled={isDisabled}
                className={cn(
                  'cursor-pointer',
                  isSelected && 'bg-accent',
                  isWrongGuess && 'line-through opacity-50 cursor-not-allowed',
                )}
              >
                <span>{game.name}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
