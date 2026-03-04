'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import type { GameModeSlug } from '@gaeldle/api-contract';
import { GAME_SEARCH_MIN_CHARS } from '@gaeldle/constants';
import { IconSearch, IconX } from '@tabler/icons-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Card } from '@/components/ui/card';
import { useGameSearch } from '@/lib/hooks/use-game-search';

interface GameSearchProps {
  selectedGameId: number | null;
  wrongGuesses: number[];
  onSelectGame: (gameId: number) => void;
  disabled?: boolean;
  className?: string;
  mode?: GameModeSlug;
}

function highlightMatch(name: string, query: string) {
  if (!query || query.length < GAME_SEARCH_MIN_CHARS) {
    return <span>{name}</span>;
  }

  const index = name.toLowerCase().indexOf(query.toLowerCase());

  if (index === -1) {
    return <span>{name}</span>;
  }

  const before = name.slice(0, index);
  const match = name.slice(index, index + query.length);
  const after = name.slice(index + query.length);

  return (
    <span>
      {before}
      <strong>{match}</strong>
      {after}
    </span>
  );
}

export default function GameSearch({
  selectedGameId,
  wrongGuesses,
  onSelectGame,
  disabled = false,
  className,
  mode,
}: Readonly<GameSearchProps>) {
  const [searchValue, setSearchValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const { results, isLoading, isIdle, debouncedQuery } = useGameSearch(searchValue, { mode });

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  "use no memo";
  // eslint-disable-next-line react-hooks/incompatible-library -- opted out of memoization via "use no memo"
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 2,
  });

  const handleSelect = (gameId: number) => {
    if (wrongGuesses.includes(gameId) || disabled) return;
    onSelectGame(gameId);
    setSearchValue('');
    setIsOpen(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setIsOpen(value.length > 0);
  };

  const handleClear = () => {
    setSearchValue('');
    setIsOpen(false);
  };

  const renderSearchContent = () => {
    if (isIdle) {
      return (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Type at least {GAME_SEARCH_MIN_CHARS} characters to search...
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Searching...
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="py-4 text-center text-xs text-muted-foreground">
          No games found.
        </div>
      );
    }

    return (
      <div
        ref={parentRef}
        className="overflow-y-auto"
        style={{
          height: `${Math.min(results.length, 6) * 40}px`,
          maxHeight: '240px',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const game = results[virtualItem.index];
            const isWrongGuess = wrongGuesses.includes(game.id);
            const isSelected = selectedGameId === game.id;
            const isDisabled = isWrongGuess || disabled;

            return (
              <button
                key={game.id}
                onClick={() => handleSelect(game.id)}
                disabled={isDisabled}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs transition-colors absolute top-0 left-0 leading-relaxed uppercase tracking-tight',
                  'hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none',
                  isSelected && 'bg-primary text-primary-foreground',
                  isWrongGuess && 'line-through opacity-50'
                )}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <span className="block truncate">
                  {highlightMatch(game.name, debouncedQuery)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('relative', className)}>
      <InputGroup className="h-10">
        <InputGroupAddon align="inline-start">
          <IconSearch className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search for a game..."
          value={searchValue}
          onChange={handleInputChange}
          disabled={disabled}
          onFocus={() => (searchValue.length > 0 ? setIsOpen(true) : null)}
          className="h-full"
        />
        {searchValue.length > 0 ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              onClick={handleClear}
              variant="ghost"
              size="icon-xs"
              className="cursor-pointer"
            >
              <IconX className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      {isOpen && searchValue.length > 0 ? (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-xl p-0 ring-1 ring-foreground/10 bg-card rounded-none">
          {renderSearchContent()}
        </Card>
      ) : null}
    </div>
  );
}
