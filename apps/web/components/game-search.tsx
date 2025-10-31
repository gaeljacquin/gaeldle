'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Game } from '@/lib/types/game';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface SpecificationsSearchProps {
  games: Game[];
  selectedGameId: number | null;
  wrongGuesses: number[];
  onSelectGame: (gameId: number) => void;
  disabled?: boolean;
  className?: string;
}

export default function GameSearch({
  games,
  selectedGameId,
  wrongGuesses,
  onSelectGame,
  disabled = false,
  className,
}: SpecificationsSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 300);

  const handleSelect = (gameId: number) => {
    if (wrongGuesses.includes(gameId) || disabled) return;
    onSelectGame(gameId);
    setSearchValue('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setIsOpen(value.length > 0);
  };

  const handleClear = () => {
    setSearchValue('');
    setIsOpen(false);
  };

  const filteredGames = useMemo(() => {
    // Only search if there are at least 2 characters
    if (debouncedSearch.length < 2) {
      return [];
    }

    const searchLower = debouncedSearch.toLowerCase();

    // Filter and limit to first 100 results for performance
    return games
      .filter((game) => game.name.toLowerCase().includes(searchLower))
      .slice(0, 100);
  }, [games, debouncedSearch]);

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <div className="flex h-10 items-center gap-2 border border-border rounded-lg px-3 bg-background">
          <Search className="size-4 shrink-0 opacity-50" />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={handleInputChange}
            disabled={disabled}
            onFocus={() => searchValue.length > 0 && setIsOpen(true)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          {searchValue.length > 0 && (
            <Button
              onClick={handleClear}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isOpen && searchValue.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
          {searchValue.length < 2 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search...
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No games found.
            </div>
          ) : (
            <div className="p-1">
              {filteredGames.map((game) => {
                const isWrongGuess = wrongGuesses.includes(game.id);
                const isSelected = selectedGameId === game.id;
                const isDisabled = isWrongGuess || disabled;

                return (
                  <button
                    key={game.id}
                    onClick={() => handleSelect(game.id)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'disabled:pointer-events-none disabled:opacity-50',
                      isSelected && 'bg-accent',
                      isWrongGuess && 'line-through opacity-50 cursor-not-allowed'
                    )}
                  >
                    {game.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
