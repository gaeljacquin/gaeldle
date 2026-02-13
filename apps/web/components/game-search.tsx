'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import type { Game, GameModeSlug } from '@gaeldle/api-contract';
import { IconSearch, IconX } from '@tabler/icons-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Card } from '@/components/ui/card';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { searchGames } from '@/lib/services/game.service';

interface GameSearchProps {
  selectedGameId: number | null;
  wrongGuesses: number[];
  onSelectGame: (gameId: number) => void;
  disabled?: boolean;
  className?: string;
  mode?: GameModeSlug;
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
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 300);
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: searchResults.length,
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
    setSearchResults([]);
  };

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const results = await searchGames(debouncedSearch, 100, mode);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearch, mode]);

  const renderSearchContent = () => {
    if (searchValue.length < 2) {
      return (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Type at least 2 characters to search...
        </div>
      );
    }

    if (isSearching) {
      return (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Searching...
        </div>
      );
    }

    if (searchResults.length === 0) {
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
          height: `${Math.min(searchResults.length, 6) * 40}px`,
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
            const game = searchResults[virtualItem.index];
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
                <span className="block truncate">{game.name}</span>
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
          onFocus={() => searchValue.length > 0 && setIsOpen(true)}
          className="h-full"
        />
        {searchValue.length > 0 && (
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
        )}
      </InputGroup>

      {isOpen && searchValue.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-xl p-0 ring-1 ring-foreground/10 bg-card rounded-none">
          {renderSearchContent()}
        </Card>
      )}
    </div>
  );
}
